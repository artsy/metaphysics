import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { TCity } from "schema/v2/city"
import { HTTPError } from "lib/HTTPError"
import moment from "moment"

const MOCK_CITIES: TCity[] = [
  {
    slug: "london-united-kingdom",
    name: "London",
    full_name: "London, United Kingdom",
    coords: [51.5, -0.12],
  },
]

const query = gql`
  {
    city(slug: "london-united-kingdom") {
      recommendedArticlesConnection {
        totalCount
        edges {
          node {
            internalID
          }
        }
      }
    }
  }
`

const monthsAgo = (months: number) =>
  moment().subtract(months, "months").toISOString()

const article = (id: string, publishedMonthsAgo: number) => ({
  id,
  published_at: monthsAgo(publishedMonthsAgo),
})

const ids = (data) =>
  data.city.recommendedArticlesConnection.edges.map(
    ({ node }) => node.internalID
  )

describe("City.recommendedArticlesConnection", () => {
  let meCityShowsLoader: jest.Mock
  let fairsLoader: jest.Mock
  let cityArticlesLoader: jest.Mock
  let articlesBySource: Record<string, any[] | Error>
  let publishedArticles: Record<string, any>
  let articlesLoader: jest.Mock

  const context = () => ({
    geodataCitiesLoader: () => Promise.resolve(MOCK_CITIES),
    meCityShowsLoader,
    fairsLoader,
    cityArticlesLoader,
    articlesLoader,
  })

  const shows = (...showIds: string[]) => ({
    body: showIds.map((_id) => ({ _id })),
    headers: { "x-total-count": `${showIds.length}` },
  })

  beforeEach(() => {
    meCityShowsLoader = jest.fn().mockResolvedValue(shows("show-a", "show-b"))
    fairsLoader = jest.fn().mockResolvedValue(shows())
    cityArticlesLoader = jest.fn().mockResolvedValue([])
    articlesBySource = {
      "show-a": [article("a-old", 10), article("a-new", 1)],
      "show-b": [article("b-newest", 0)],
    }
    publishedArticles = {}
    articlesLoader = jest.fn(({ show_id, fair_id, ids }) => {
      if (ids) {
        return Promise.resolve({
          results: ids.flatMap((id) =>
            publishedArticles[id] ? [publishedArticles[id]] : []
          ),
        })
      }
      const result = articlesBySource[show_id ?? fair_id]
      return result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve({ results: result ?? [] })
    })
  })

  it("asks Gravity for the user's ranked running shows and the city's running fairs, and Positron for their articles", async () => {
    fairsLoader.mockResolvedValue(shows("fair-a"))

    await runQuery(query, context())

    expect(meCityShowsLoader).toHaveBeenCalledWith({
      near: "51.5,-0.12",
      max_distance: 25,
      has_location: true,
      at_a_fair: false,
      status: "running",
      displayable: true,
      include_local_discovery: false,
      include_discovery_blocked: false,
      max_per_partner: undefined,
      size: 10,
    })
    expect(fairsLoader).toHaveBeenCalledWith({
      near: "51.5,-0.12",
      max_distance: 25,
      status: "running",
      size: 3,
    })
    expect(articlesLoader).toHaveBeenCalledWith({
      show_id: "show-a",
      published: true,
      in_editorial_feed: true,
      sort: "-published_at",
      limit: 3,
    })
    expect(articlesLoader).toHaveBeenCalledWith({
      fair_id: "fair-a",
      published: true,
      in_editorial_feed: true,
      sort: "-published_at",
      limit: 3,
    })
    expect(articlesLoader).toHaveBeenCalledTimes(3)
  })

  it("ranks by the show's rank for the user, then by newest first", async () => {
    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["a-new", "a-old", "b-newest"])
    expect(data.city.recommendedArticlesConnection.totalCount).toEqual(3)
  })

  it("returns at most `first` articles", async () => {
    const data = await runQuery(
      gql`
        {
          city(slug: "london-united-kingdom") {
            recommendedArticlesConnection(first: 2) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `,
      context()
    )

    expect(ids(data)).toEqual(["a-new", "a-old"])
  })

  it("fetches articles for the top 10 shows at most", async () => {
    meCityShowsLoader.mockResolvedValue(
      shows(...Array.from({ length: 12 }, (_, i) => `show-${i}`))
    )

    await runQuery(query, context())

    expect(articlesLoader).toHaveBeenCalledTimes(10)
  })

  it("lists fair articles after every show article, newest first", async () => {
    fairsLoader.mockResolvedValue(shows("fair-a", "fair-b"))
    articlesBySource["fair-a"] = [article("fair-a-old", 5)]
    articlesBySource["fair-b"] = [article("fair-b-new", 0)]

    const data = await runQuery(
      gql`
        {
          city(slug: "london-united-kingdom") {
            recommendedArticlesConnection(first: 10) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `,
      context()
    )

    expect(ids(data)).toEqual([
      "a-new",
      "a-old",
      "b-newest",
      "fair-b-new",
      "fair-a-old",
    ])
  })

  it("lists fair articles alone when Gravity can't rank shows", async () => {
    meCityShowsLoader.mockRejectedValue(new HTTPError("Not Found", 404))
    fairsLoader.mockResolvedValue(shows("fair-a"))
    articlesBySource["fair-a"] = [article("fair-a-old", 5)]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["fair-a-old"])
  })

  it("keeps the show articles when the fairs fetch fails", async () => {
    fairsLoader.mockRejectedValue(new HTTPError("Internal Server Error", 500))

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["a-new", "a-old", "b-newest"])
  })

  it("excludes the city's curated articles", async () => {
    cityArticlesLoader.mockResolvedValue([
      { id: "join-1", city_slug: "london-united-kingdom", article_id: "a-new" },
    ])

    const data = await runQuery(query, context())

    expect(cityArticlesLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
    })
    expect(ids(data)).toEqual(["a-old", "b-newest"])
  })

  it("lists an article about several shows once, at its best show's rank", async () => {
    articlesBySource["show-b"] = [article("b-newest", 0), article("a-old", 10)]
    articlesBySource["show-c"] = [article("shared", 2)]
    articlesBySource["show-a"] = [article("shared", 2)]
    meCityShowsLoader.mockResolvedValue(shows("show-a", "show-b", "show-c"))

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["shared", "b-newest", "a-old"])
  })

  it("drops articles published more than 24 months ago", async () => {
    articlesBySource["show-a"] = [article("a-new", 1), article("ancient", 30)]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["a-new", "b-newest"])
  })

  it("keeps the other shows' articles when one show's fetch fails", async () => {
    articlesBySource["show-a"] = new Error("Positron is down")

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["b-newest"])
  })

  describe("returns an empty connection", () => {
    const expectEmpty = (data) =>
      expect(data.city.recommendedArticlesConnection).toEqual({
        totalCount: 0,
        edges: [],
      })

    it("when signed out", async () => {
      const data = await runQuery(query, {
        ...context(),
        meCityShowsLoader: undefined,
      })

      expectEmpty(data)
      expect(articlesLoader).not.toHaveBeenCalled()
    })

    it("when Gravity returns 404", async () => {
      meCityShowsLoader.mockRejectedValue(new HTTPError("Not Found", 404))

      expectEmpty(await runQuery(query, context()))
    })

    it("when Gravity errors", async () => {
      meCityShowsLoader.mockRejectedValue(
        new HTTPError("Internal Server Error", 500)
      )

      expectEmpty(await runQuery(query, context()))
    })

    it("when the city has no running shows or fairs", async () => {
      meCityShowsLoader.mockResolvedValue(shows())

      expectEmpty(await runQuery(query, context()))
      expect(articlesLoader).not.toHaveBeenCalled()
    })
  })
  describe("with includeFeatured", () => {
    const featuredQuery = (args = "includeFeatured: true, first: 10") => gql`
      {
        city(slug: "london-united-kingdom") {
          recommendedArticlesConnection(${args}) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            pageCursors {
              around {
                page
                isCurrent
              }
            }
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    const join = (article_id: string, position: number) => ({
      id: `join-${article_id}`,
      city_slug: "london-united-kingdom",
      article_id,
      position,
    })

    beforeEach(() => {
      publishedArticles = {
        "curated-1": article("curated-1", 40),
        "curated-2": article("curated-2", 3),
      }
      cityArticlesLoader.mockResolvedValue([
        join("curated-2", 2),
        join("unpublished", 1),
        join("curated-1", 0),
      ])
    })

    it("lists the curated articles by position, then the recommendations", async () => {
      const data = await runQuery(featuredQuery(), context())

      expect(ids(data)).toEqual([
        "curated-1",
        "curated-2",
        "a-new",
        "a-old",
        "b-newest",
      ])
      expect(data.city.recommendedArticlesConnection.totalCount).toEqual(5)
      expect(articlesLoader).toHaveBeenCalledWith({
        ids: ["curated-2", "unpublished", "curated-1"],
        published: true,
        limit: 3,
      })
    })

    it("lists an article that is both curated and recommended once, as curated", async () => {
      publishedArticles["b-newest"] = article("b-newest", 0)
      cityArticlesLoader.mockResolvedValue([join("b-newest", 0)])

      const data = await runQuery(featuredQuery(), context())

      expect(ids(data)).toEqual(["b-newest", "a-new", "a-old"])
    })

    it("returns only the curated articles when signed out", async () => {
      const data = await runQuery(featuredQuery(), {
        ...context(),
        meCityShowsLoader: undefined,
      })

      expect(ids(data)).toEqual(["curated-1", "curated-2"])
      expect(data.city.recommendedArticlesConnection.totalCount).toEqual(2)
    })

    it("returns only the curated articles when Gravity returns 404", async () => {
      meCityShowsLoader.mockRejectedValue(new HTTPError("Not Found", 404))

      const data = await runQuery(featuredQuery(), context())

      expect(ids(data)).toEqual(["curated-1", "curated-2"])
    })

    it("returns only the curated articles when Gravity errors", async () => {
      meCityShowsLoader.mockRejectedValue(
        new HTTPError("Internal Server Error", 500)
      )

      const data = await runQuery(featuredQuery(), context())

      expect(ids(data)).toEqual(["curated-1", "curated-2"])
    })

    it("paginates across the curated and recommended articles", async () => {
      const page1 = await runQuery(
        featuredQuery("includeFeatured: true, first: 3"),
        context()
      )
      const connection1 = page1.city.recommendedArticlesConnection

      expect(ids(page1)).toEqual(["curated-1", "curated-2", "a-new"])
      expect(connection1.totalCount).toEqual(5)
      expect(connection1.pageInfo.hasNextPage).toBe(true)
      expect(connection1.pageCursors.around).toEqual([
        { page: 1, isCurrent: true },
        { page: 2, isCurrent: false },
      ])

      const page2 = await runQuery(
        featuredQuery(
          `includeFeatured: true, first: 3, after: "${connection1.pageInfo.endCursor}"`
        ),
        context()
      )
      const connection2 = page2.city.recommendedArticlesConnection

      expect(ids(page2)).toEqual(["a-old", "b-newest"])
      expect(connection2.totalCount).toEqual(5)
      expect(connection2.pageInfo.hasNextPage).toBe(false)
      expect(connection2.pageCursors.around).toEqual([
        { page: 1, isCurrent: false },
        { page: 2, isCurrent: true },
      ])
    })
  })

  it("paginates the recommendations with after when includeFeatured is false", async () => {
    const pageQuery = (args: string) => gql`
      {
        city(slug: "london-united-kingdom") {
          recommendedArticlesConnection(${args}) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `
    const page1 = await runQuery(pageQuery("first: 2"), context())
    const { pageInfo, totalCount } = page1.city.recommendedArticlesConnection

    expect(ids(page1)).toEqual(["a-new", "a-old"])
    expect(totalCount).toEqual(3)
    expect(pageInfo.hasNextPage).toBe(true)

    const page2 = await runQuery(
      pageQuery(`first: 2, after: "${pageInfo.endCursor}"`),
      context()
    )

    expect(ids(page2)).toEqual(["b-newest"])
    expect(page2.city.recommendedArticlesConnection.pageInfo.hasNextPage).toBe(
      false
    )
  })
})
