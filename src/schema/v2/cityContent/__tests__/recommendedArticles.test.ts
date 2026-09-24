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
  let meCityArtistsLoader: jest.Mock
  let cityArticlesLoader: jest.Mock
  let articlesByArtist: Record<string, any[] | Error>
  let articlesLoader: jest.Mock

  const context = () => ({
    geodataCitiesLoader: () => Promise.resolve(MOCK_CITIES),
    meCityArtistsLoader,
    cityArticlesLoader,
    articlesLoader,
  })

  beforeEach(() => {
    meCityArtistsLoader = jest.fn().mockResolvedValue([
      { artist_id: "artist-a", score: 0.9 },
      { artist_id: "artist-b", score: 0.5 },
    ])
    cityArticlesLoader = jest.fn().mockResolvedValue([])
    articlesByArtist = {
      "artist-a": [article("a-old", 10), article("a-new", 1)],
      "artist-b": [article("b-newest", 0)],
    }
    articlesLoader = jest.fn(({ artist_id }) => {
      const result = articlesByArtist[artist_id]
      return result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve({ results: result ?? [] })
    })
  })

  it("asks Gravity for the city's running-show artists, and Positron for their articles", async () => {
    await runQuery(query, context())

    expect(meCityArtistsLoader).toHaveBeenCalledWith({
      near: "51.5,-0.12",
      max_distance: 25,
      has_location: true,
      at_a_fair: false,
      status: "running",
      displayable: true,
      include_local_discovery: false,
      include_discovery_blocked: false,
      max_per_partner: undefined,
      limit: 10,
    })
    expect(articlesLoader).toHaveBeenCalledWith({
      artist_id: "artist-a",
      published: true,
      in_editorial_feed: true,
      sort: "-published_at",
      limit: 3,
    })
    expect(articlesLoader).toHaveBeenCalledTimes(2)
  })

  it("ranks by artist score, then by newest first", async () => {
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

  it("fetches articles for the top 10 artists at most", async () => {
    meCityArtistsLoader.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        artist_id: `artist-${i}`,
        score: 1 - i / 100,
      }))
    )

    await runQuery(query, context())

    expect(articlesLoader).toHaveBeenCalledTimes(10)
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

  it("lists an article about several artists once, at its best artist's rank", async () => {
    articlesByArtist["artist-b"] = [
      article("b-newest", 0),
      article("a-old", 10),
    ]
    articlesByArtist["artist-c"] = [article("shared", 2)]
    articlesByArtist["artist-a"] = [article("shared", 2)]
    meCityArtistsLoader.mockResolvedValue([
      { artist_id: "artist-c", score: 0.1 },
      { artist_id: "artist-b", score: 0.5 },
      { artist_id: "artist-a", score: 0.9 },
    ])

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["shared", "b-newest", "a-old"])
  })

  it("drops articles published more than 24 months ago", async () => {
    articlesByArtist["artist-a"] = [article("a-new", 1), article("ancient", 30)]

    const data = await runQuery(query, context())

    expect(ids(data)).toEqual(["a-new", "b-newest"])
  })

  it("keeps the other artists' articles when one artist's fetch fails", async () => {
    articlesByArtist["artist-a"] = new Error("Positron is down")

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
        meCityArtistsLoader: undefined,
      })

      expectEmpty(data)
      expect(articlesLoader).not.toHaveBeenCalled()
    })

    it("when Gravity returns 404", async () => {
      meCityArtistsLoader.mockRejectedValue(new HTTPError("Not Found", 404))

      expectEmpty(await runQuery(query, context()))
    })

    it("when Gravity errors", async () => {
      meCityArtistsLoader.mockRejectedValue(
        new HTTPError("Internal Server Error", 500)
      )

      expectEmpty(await runQuery(query, context()))
    })

    it("when Gravity has no artists", async () => {
      meCityArtistsLoader.mockResolvedValue([])

      expectEmpty(await runQuery(query, context()))
      expect(articlesLoader).not.toHaveBeenCalled()
    })
  })
})
