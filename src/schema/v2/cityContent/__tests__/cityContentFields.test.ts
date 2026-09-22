import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { TCity } from "schema/v2/city"

const MOCK_CITIES: TCity[] = [
  {
    slug: "london-united-kingdom",
    name: "London",
    full_name: "London, United Kingdom",
    coords: [51.5, -0.12],
  },
]

const MOCK_CONTEXT = {
  geodataCitiesLoader: () => Promise.resolve(MOCK_CITIES),
}

describe("City.cityArticles", () => {
  it("returns the city's attached articles, in order", async () => {
    const cityArticlesLoader = jest.fn().mockResolvedValue([
      {
        id: "article-join-1",
        city_slug: "london-united-kingdom",
        article_id: "article-1",
        position: 0,
      },
    ])
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const query = gql`
      {
        city(slug: "london-united-kingdom") {
          cityArticles {
            position
            article {
              internalID
              title
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      ...MOCK_CONTEXT,
      cityArticlesLoader,
      articlesLoader,
    })

    expect(cityArticlesLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
    })
    expect(data.city.cityArticles).toEqual([
      {
        position: 0,
        article: { internalID: "article-1", title: "London Art Week Guide" },
      },
    ])
  })

  it("drops joins whose article Positron didn't return", async () => {
    const cityArticlesLoader = jest.fn().mockResolvedValue([
      {
        id: "article-join-1",
        city_slug: "london-united-kingdom",
        article_id: "article-1",
        position: 0,
      },
    ])
    const articlesLoader = jest.fn().mockResolvedValue({ results: [] })

    const query = gql`
      {
        city(slug: "london-united-kingdom") {
          cityArticles {
            position
          }
        }
      }
    `

    const data = await runQuery(query, {
      ...MOCK_CONTEXT,
      cityArticlesLoader,
      articlesLoader,
    })

    expect(data.city.cityArticles).toEqual([])
  })

  it("never calls the Positron loader when the city has no articles", async () => {
    const cityArticlesLoader = jest.fn().mockResolvedValue([])
    const articlesLoader = jest.fn()

    const query = gql`
      {
        city(slug: "london-united-kingdom") {
          cityArticles {
            position
          }
        }
      }
    `

    const data = await runQuery(query, {
      ...MOCK_CONTEXT,
      cityArticlesLoader,
      articlesLoader,
    })

    expect(data.city.cityArticles).toEqual([])
    expect(articlesLoader).not.toHaveBeenCalled()
  })

  it("re-matches articles by id, not by Positron's return order", async () => {
    const cityArticlesLoader = jest.fn().mockResolvedValue([
      {
        id: "article-join-1",
        city_slug: "london-united-kingdom",
        article_id: "article-1",
        position: 0,
      },
      {
        id: "article-join-2",
        city_slug: "london-united-kingdom",
        article_id: "article-2",
        position: 1,
      },
    ])
    // Positron returns them in the opposite order from how they were requested.
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [
        { id: "article-2", title: "Second Article" },
        { id: "article-1", title: "First Article" },
      ],
    })

    const query = gql`
      {
        city(slug: "london-united-kingdom") {
          cityArticles {
            position
            article {
              internalID
              title
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      ...MOCK_CONTEXT,
      cityArticlesLoader,
      articlesLoader,
    })

    expect(data.city.cityArticles).toEqual([
      {
        position: 0,
        article: { internalID: "article-1", title: "First Article" },
      },
      {
        position: 1,
        article: { internalID: "article-2", title: "Second Article" },
      },
    ])
  })
})

describe("City.cityVideos", () => {
  it("returns the city's attached videos, in order", async () => {
    const cityVideosLoader = jest.fn().mockResolvedValue([
      {
        id: "video-join-1",
        city_slug: "london-united-kingdom",
        video_id: "video-1",
        position: 0,
        video: { _id: "video-1", title: "London Art Week Recap" },
      },
    ])

    const query = gql`
      {
        city(slug: "london-united-kingdom") {
          cityVideos {
            position
            video {
              title
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      ...MOCK_CONTEXT,
      cityVideosLoader,
    })

    expect(cityVideosLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
    })
    expect(data.city.cityVideos).toEqual([
      { position: 0, video: { title: "London Art Week Recap" } },
    ])
  })

  it("returns an empty list when the city has no videos", async () => {
    const cityVideosLoader = jest.fn().mockResolvedValue([])

    const query = gql`
      {
        city(slug: "london-united-kingdom") {
          cityVideos {
            position
          }
        }
      }
    `

    const data = await runQuery(query, { ...MOCK_CONTEXT, cityVideosLoader })

    expect(data.city.cityVideos).toEqual([])
  })
})
