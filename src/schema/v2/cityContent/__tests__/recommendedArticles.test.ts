import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { TCity } from "schema/v2/city"
import { HTTPError } from "lib/HTTPError"
import moment from "moment"
import { cityTitlePattern } from "../cityTitlePattern"

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
      recommendedArticlesConnection(first: 10) {
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

const article = (
  id: string,
  publishedMonthsAgo: number,
  extra: Record<string, unknown> = {}
) => ({
  id,
  published_at: monthsAgo(publishedMonthsAgo),
  ...extra,
})

const ids = (data) =>
  data.city.recommendedArticlesConnection.edges.map(
    ({ node }) => node.internalID
  )

describe("cityTitlePattern", () => {
  it("is the city's name, anchored to the start of a word", () => {
    expect(cityTitlePattern(MOCK_CITIES[0])).toEqual("\\b(?:London)")
  })

  it("matches the name at the start of a word only", () => {
    const paris = new RegExp(
      cityTitlePattern({
        slug: "paris-france",
        name: "Paris",
        full_name: "Paris, France",
        coords: [48.9, 2.35],
      }),
      "i"
    )

    expect(paris.test("Paris Photo 2026 Opens")).toBe(true)
    expect(paris.test("Meet the Parisian Dealers")).toBe(true)
    expect(paris.test("A Comparison of Two Auction Seasons")).toBe(false)
  })

  it("adds the city's aliases, regex-escaped", () => {
    expect(
      cityTitlePattern({
        slug: "los-angeles-ca-usa",
        name: "Los Angeles",
        full_name: "Los Angeles, CA, USA",
        coords: [34, -118],
      })
    ).toEqual("\\b(?:Los Angeles|L\\.A\\.)")
    expect(
      cityTitlePattern({
        slug: "new-york-ny-usa",
        name: "New York",
        full_name: "New York, NY, USA",
        coords: [40.7, -74],
      })
    ).toEqual("\\b(?:New York|NYC)")
  })
})

describe("City.recommendedArticlesConnection", () => {
  let meCityShowsLoader: jest.Mock
  let cityArticlesLoader: jest.Mock
  let titleArticles: any[] | Error
  let articlesByPartner: Record<string, any[] | Error>
  let publishedArticles: Record<string, any>
  let articlesLoader: jest.Mock

  const context = () => ({
    geodataCitiesLoader: () => Promise.resolve(MOCK_CITIES),
    meCityShowsLoader,
    cityArticlesLoader,
    articlesLoader,
  })

  const show = (_id: string, partnerId: string | null) => ({
    _id,
    partner: partnerId ? { _id: partnerId } : null,
  })

  const gravityShows = (...shows: ReturnType<typeof show>[]) => ({
    body: shows,
    headers: { "x-total-count": `${shows.length}` },
  })

  const resolveOrReject = (result: any[] | Error | undefined) =>
    result instanceof Error
      ? Promise.reject(result)
      : Promise.resolve({ results: result ?? [] })

  beforeEach(() => {
    meCityShowsLoader = jest
      .fn()
      .mockResolvedValue(
        gravityShows(show("show-a", "gallery-a"), show("show-b", "gallery-b"))
      )
    cityArticlesLoader = jest.fn().mockResolvedValue([])
    titleArticles = [article("title-new", 0), article("title-old", 12)]
    articlesByPartner = {
      "gallery-a": [article("a-new", 1), article("a-old", 10)],
      "gallery-b": [article("b-newest", 0)],
    }
    publishedArticles = {}
    articlesLoader = jest.fn(({ q, partner_id, ids }) => {
      if (ids) {
        return Promise.resolve({
          results: ids.flatMap((id) =>
            publishedArticles[id] ? [publishedArticles[id]] : []
          ),
        })
      }
      if (q) return resolveOrReject(titleArticles)
      return resolveOrReject(articlesByPartner[partner_id])
    })
  })

  it("asks Positron for recent articles naming the city, and Gravity for the user's ranked running shows", async () => {
    await runQuery(query, context())

    expect(articlesLoader).toHaveBeenCalledWith({
      q: "\\b(?:London)",
      published: true,
      in_editorial_feed: true,
      sort: "-published_at",
      published_since: expect.any(String),
      limit: 30,
    })
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
  })

  it("asks Positron for the latest articles of each show's gallery", async () => {
    await runQuery(query, context())

    expect(articlesLoader).toHaveBeenCalledWith({
      partner_id: "gallery-a",
      published: true,
      in_editorial_feed: true,
      sort: "-published_at",
      published_since: expect.any(String),
      limit: 6,
    })
    expect(articlesLoader).toHaveBeenCalledWith(
      expect.objectContaining({ partner_id: "gallery-b" })
    )
    expect(articlesLoader).toHaveBeenCalledTimes(3)
  })

  it("asks Positron for articles published in the last 24 months", async () => {
    await runQuery(query, context())

    const { published_since } = articlesLoader.mock.calls.find(
      ([params]) => params.q
    )[0]
    const monthsBack = moment().diff(moment(published_since), "months", true)

    expect(monthsBack).toBeGreaterThan(23.9)
    expect(monthsBack).toBeLessThan(24.1)
  })

  it("rounds the cutoff to the day, so the Positron queries cache across requests", async () => {
    await runQuery(query, context())

    const cutoffs = articlesLoader.mock.calls.map(
      ([params]) => params.published_since
    )

    expect(new Set(cutoffs).size).toEqual(1)
    expect(moment(cutoffs[0]).isSame(moment(cutoffs[0]).startOf("day"))).toBe(
      true
    )
  })

  it("lists title matches newest first, then gallery articles by the show's rank, newest first", async () => {
    const data = await runQuery(query, context())

    expect(ids(data)).toEqual([
      "title-new",
      "title-old",
      "a-new",
      "a-old",
      "b-newest",
    ])
    expect(data.city.recommendedArticlesConnection.totalCount).toEqual(5)
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

    expect(ids(data)).toEqual(["title-new", "title-old"])
  })

  it("fetches gallery articles for the top 10 shows at most", async () => {
    meCityShowsLoader.mockResolvedValue(
      gravityShows(
        ...Array.from({ length: 12 }, (_, i) =>
          show(`show-${i}`, `gallery-${i}`)
        )
      )
    )

    await runQuery(query, context())

    // 10 galleries plus the title match
    expect(articlesLoader).toHaveBeenCalledTimes(11)
    expect(articlesLoader).not.toHaveBeenCalledWith(
      expect.objectContaining({ partner_id: "gallery-10" })
    )
  })

  it("fetches a gallery's articles once when it has several shows, at its best show's rank", async () => {
    meCityShowsLoader.mockResolvedValue(
      gravityShows(
        show("show-a", "gallery-a"),
        show("show-b", "gallery-b"),
        show("show-c", "gallery-a")
      )
    )

    const data = await runQuery(query, context())

    expect(articlesLoader).toHaveBeenCalledTimes(3)
    expect(ids(data)).toEqual([
      "title-new",
      "title-old",
      "a-new",
      "a-old",
      "b-newest",
    ])
  })

  it("skips shows without a gallery", async () => {
    meCityShowsLoader.mockResolvedValue(
      gravityShows(show("show-a", null), show("show-b", "gallery-b"))
    )

    const data = await runQuery(query, context())

    expect(articlesLoader).toHaveBeenCalledTimes(2)
    expect(ids(data)).toEqual(["title-new", "title-old", "b-newest"])
  })

  it("lists at most 2 articles per gallery", async () => {
    articlesByPartner["gallery-a"] = [
      article("a-1", 1),
      article("a-2", 2),
      article("a-3", 3),
    ]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual([
      "title-new",
      "title-old",
      "a-1",
      "a-2",
      "b-newest",
    ])
  })

  it("leaves out a gallery's fair recaps, without counting them toward its 2", async () => {
    articlesByPartner["gallery-a"] = [
      article("what-sold", 0, { fair_ids: ["fair-1"] }),
      article("a-1", 1, { fair_ids: [] }),
      article("a-2", 2, { fair_ids: null }),
    ]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual([
      "title-new",
      "title-old",
      "a-1",
      "a-2",
      "b-newest",
    ])
  })

  it("lists an article that both names the city and is linked to a gallery once, as a title match", async () => {
    articlesByPartner["gallery-a"] = [
      article("title-old", 12),
      article("a-new", 1),
    ]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["title-new", "title-old", "a-new", "b-newest"])
  })

  it("lists only title matches when signed out", async () => {
    const data = await runQuery(query, {
      ...context(),
      meCityShowsLoader: undefined,
    })

    expect(ids(data)).toEqual(["title-new", "title-old"])
    expect(articlesLoader).toHaveBeenCalledTimes(1)
  })

  it("lists only title matches when Gravity can't rank shows", async () => {
    meCityShowsLoader.mockRejectedValue(new HTTPError("Not Found", 404))

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["title-new", "title-old"])
  })

  it("lists only title matches when Gravity errors on shows", async () => {
    meCityShowsLoader.mockRejectedValue(
      new HTTPError("Internal Server Error", 500)
    )

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["title-new", "title-old"])
  })

  it("lists only gallery articles when the title search fails", async () => {
    titleArticles = new Error("Positron is down")

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["a-new", "a-old", "b-newest"])
  })

  it("keeps the other galleries' articles when one gallery's fetch fails", async () => {
    articlesByPartner["gallery-a"] = new Error("Positron is down")

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["title-new", "title-old", "b-newest"])
  })

  it("doesn't search titles for the online city", async () => {
    await runQuery(
      gql`
        {
          city(slug: "online") {
            recommendedArticlesConnection {
              totalCount
            }
          }
        }
      `,
      context()
    )

    expect(articlesLoader).not.toHaveBeenCalledWith(
      expect.objectContaining({ q: expect.anything() })
    )
  })

  it("keeps the recommendations when the curated articles fail to load", async () => {
    cityArticlesLoader.mockRejectedValue(
      new HTTPError("Internal Server Error", 500)
    )

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual([
      "title-new",
      "title-old",
      "a-new",
      "a-old",
      "b-newest",
    ])
  })

  it("excludes the city's curated articles", async () => {
    cityArticlesLoader.mockResolvedValue([
      {
        id: "join-1",
        city_slug: "london-united-kingdom",
        article_id: "title-new",
      },
      { id: "join-2", city_slug: "london-united-kingdom", article_id: "a-new" },
    ])

    const data = await runQuery(query, context())

    expect(cityArticlesLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
    })
    expect(ids(data)).toEqual(["title-old", "a-old", "b-newest"])
  })

  it("drops articles published more than 24 months ago", async () => {
    titleArticles = [article("title-new", 0), article("ancient-title", 30)]
    articlesByPartner["gallery-a"] = [
      article("a-new", 1),
      article("ancient", 30),
    ]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["title-new", "a-new", "b-newest"])
  })

  describe("returns an empty connection", () => {
    const expectEmpty = (data) =>
      expect(data.city.recommendedArticlesConnection).toEqual({
        totalCount: 0,
        edges: [],
      })

    it("when nothing names the city and the city has no running shows", async () => {
      titleArticles = []
      meCityShowsLoader.mockResolvedValue(gravityShows())

      expectEmpty(await runQuery(query, context()))
      expect(articlesLoader).toHaveBeenCalledTimes(1)
    })

    it("when nothing names the city and the user is signed out", async () => {
      titleArticles = []

      expectEmpty(
        await runQuery(query, { ...context(), meCityShowsLoader: undefined })
      )
      expect(articlesLoader).toHaveBeenCalledTimes(1)
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
        "title-new",
        "title-old",
        "a-new",
        "a-old",
        "b-newest",
      ])
      expect(data.city.recommendedArticlesConnection.totalCount).toEqual(7)
      expect(articlesLoader).toHaveBeenCalledWith({
        ids: ["curated-2", "unpublished", "curated-1"],
        published: true,
        limit: 3,
      })
    })

    it("lists an article that is both curated and recommended once, as curated", async () => {
      publishedArticles["title-new"] = article("title-new", 0)
      cityArticlesLoader.mockResolvedValue([join("title-new", 0)])

      const data = await runQuery(featuredQuery(), context())

      expect(ids(data)).toEqual([
        "title-new",
        "title-old",
        "a-new",
        "a-old",
        "b-newest",
      ])
    })

    it("lists the curated articles, then the title matches, when signed out", async () => {
      const data = await runQuery(featuredQuery(), {
        ...context(),
        meCityShowsLoader: undefined,
      })

      expect(ids(data)).toEqual([
        "curated-1",
        "curated-2",
        "title-new",
        "title-old",
      ])
      expect(data.city.recommendedArticlesConnection.totalCount).toEqual(4)
    })

    it("paginates across the curated and recommended articles", async () => {
      const page1 = await runQuery(
        featuredQuery("includeFeatured: true, first: 4"),
        context()
      )
      const connection1 = page1.city.recommendedArticlesConnection

      expect(ids(page1)).toEqual([
        "curated-1",
        "curated-2",
        "title-new",
        "title-old",
      ])
      expect(connection1.totalCount).toEqual(7)
      expect(connection1.pageInfo.hasNextPage).toBe(true)
      expect(connection1.pageCursors.around).toEqual([
        { page: 1, isCurrent: true },
        { page: 2, isCurrent: false },
      ])

      const page2 = await runQuery(
        featuredQuery(
          `includeFeatured: true, first: 4, after: "${connection1.pageInfo.endCursor}"`
        ),
        context()
      )
      const connection2 = page2.city.recommendedArticlesConnection

      expect(ids(page2)).toEqual(["a-new", "a-old", "b-newest"])
      expect(connection2.totalCount).toEqual(7)
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
    const page1 = await runQuery(pageQuery("first: 3"), context())
    const { pageInfo, totalCount } = page1.city.recommendedArticlesConnection

    expect(ids(page1)).toEqual(["title-new", "title-old", "a-new"])
    expect(totalCount).toEqual(5)
    expect(pageInfo.hasNextPage).toBe(true)

    const page2 = await runQuery(
      pageQuery(`first: 3, after: "${pageInfo.endCursor}"`),
      context()
    )

    expect(ids(page2)).toEqual(["a-old", "b-newest"])
    expect(page2.city.recommendedArticlesConnection.pageInfo.hasNextPage).toBe(
      false
    )
  })
})
