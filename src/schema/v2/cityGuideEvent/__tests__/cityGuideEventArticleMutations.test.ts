import { runQuery } from "schema/v2/test/utils"

const gravityJoin = {
  id: "article-join-1",
  city_guide_event_id: "event-1",
  article_id: "article-1",
  position: 0,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
}

const gravityCityGuideEvent = {
  id: "event-1",
  slug: "london-art-week",
  title: "London Art Week",
  subtitle: null,
  description: null,
  city_slug: "london-united-kingdom",
  start_at: "2026-10-05T00:00:00Z",
  end_at: "2026-10-12T00:00:00Z",
  time_zone: null,
  published_at: null,
  published_by_id: null,
  image_url: null,
  image_urls: null,
  itineraries: [],
  articles: [gravityJoin],
  video: null,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

describe("createCityGuideEventArticle", () => {
  it("attaches an article and returns the event's updated article list", async () => {
    const createCityGuideEventArticleLoader = jest
      .fn()
      .mockResolvedValue(gravityJoin)
    const cityGuideEventLoader = jest
      .fn()
      .mockResolvedValue(gravityCityGuideEvent)
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const mutation = `
      mutation {
        createCityGuideEventArticle(
          input: { cityGuideEventID: "london-art-week", articleID: "article-1" }
        ) {
          responseOrError {
            ... on CityGuideEventMutationSuccess {
              cityGuideEvent {
                articles {
                  article { internalID title }
                }
              }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, {
      createCityGuideEventArticleLoader,
      cityGuideEventLoader,
      articlesLoader,
    })

    expect(createCityGuideEventArticleLoader).toHaveBeenCalledWith({
      city_guide_event_id: "london-art-week",
      article_id: "article-1",
    })
    expect(cityGuideEventLoader).toHaveBeenCalledWith("event-1")
    expect(
      data.createCityGuideEventArticle.responseOrError.cityGuideEvent.articles
    ).toEqual([
      { article: { internalID: "article-1", title: "London Art Week Guide" } },
    ])
  })
})

describe("updateCityGuideEventArticle", () => {
  it("moves an article and returns the event's updated article list", async () => {
    const updateCityGuideEventArticleLoader = jest
      .fn()
      .mockResolvedValue(gravityJoin)
    const cityGuideEventLoader = jest
      .fn()
      .mockResolvedValue(gravityCityGuideEvent)
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const mutation = `
      mutation {
        updateCityGuideEventArticle(input: { id: "article-join-1", position: 0 }) {
          responseOrError {
            ... on CityGuideEventMutationSuccess {
              cityGuideEvent { internalID }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, {
      updateCityGuideEventArticleLoader,
      cityGuideEventLoader,
      articlesLoader,
    })

    expect(updateCityGuideEventArticleLoader).toHaveBeenCalledWith(
      "article-join-1",
      {
        position: 0,
      }
    )
    expect(
      data.updateCityGuideEventArticle.responseOrError.cityGuideEvent.internalID
    ).toEqual("event-1")
  })
})

describe("deleteCityGuideEventArticle", () => {
  it("detaches an article and returns the event's remaining article list", async () => {
    const deleteCityGuideEventArticleLoader = jest
      .fn()
      .mockResolvedValue(gravityJoin)
    const cityGuideEventLoader = jest
      .fn()
      .mockResolvedValue({ ...gravityCityGuideEvent, articles: [] })

    const mutation = `
      mutation {
        deleteCityGuideEventArticle(input: { id: "article-join-1" }) {
          responseOrError {
            ... on CityGuideEventMutationSuccess {
              cityGuideEvent { articles { internalID } }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, {
      deleteCityGuideEventArticleLoader,
      cityGuideEventLoader,
    })

    expect(deleteCityGuideEventArticleLoader).toHaveBeenCalledWith(
      "article-join-1",
      {}
    )
    expect(
      data.deleteCityGuideEventArticle.responseOrError.cityGuideEvent.articles
    ).toEqual([])
  })
})
