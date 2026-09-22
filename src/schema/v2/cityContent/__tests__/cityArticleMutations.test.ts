import { runQuery } from "schema/v2/test/utils"

const gravityJoin = {
  id: "article-join-1",
  city_slug: "london-united-kingdom",
  article_id: "article-1",
  position: 0,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

describe("createCityArticle", () => {
  it("attaches an article to a city", async () => {
    const createCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const mutation = `
      mutation {
        createCityArticle(
          input: { citySlug: "london-united-kingdom", articleID: "article-1" }
        ) {
          responseOrError {
            ... on CityArticleMutationSuccess {
              cityArticle {
                position
                article { internalID title }
              }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, {
      createCityArticleLoader,
      articlesLoader,
    })

    expect(createCityArticleLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
      article_id: "article-1",
    })
    expect(data.createCityArticle.responseOrError.cityArticle).toEqual({
      position: 0,
      article: { internalID: "article-1", title: "London Art Week Guide" },
    })
  })
})

describe("updateCityArticle", () => {
  it("moves an article within its city's list", async () => {
    const updateCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const mutation = `
      mutation {
        updateCityArticle(input: { id: "article-join-1", position: 0 }) {
          responseOrError {
            ... on CityArticleMutationSuccess {
              cityArticle { position }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, {
      updateCityArticleLoader,
      articlesLoader,
    })

    expect(updateCityArticleLoader).toHaveBeenCalledWith("article-join-1", {
      position: 0,
    })
    expect(data.updateCityArticle.responseOrError.cityArticle.position).toEqual(
      0
    )
  })
})

describe("deleteCityArticle", () => {
  it("detaches an article from a city", async () => {
    const deleteCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const mutation = `
      mutation {
        deleteCityArticle(input: { id: "article-join-1" }) {
          responseOrError {
            ... on CityArticleMutationSuccess {
              cityArticle { internalID }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, {
      deleteCityArticleLoader,
      articlesLoader,
    })

    expect(deleteCityArticleLoader).toHaveBeenCalledWith("article-join-1", {})
    expect(
      data.deleteCityArticle.responseOrError.cityArticle.internalID
    ).toEqual("article-join-1")
  })
})
