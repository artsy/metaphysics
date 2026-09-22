import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const gravityJoin = {
  id: "article-join-1",
  city_slug: "london-united-kingdom",
  article_id: "article-1",
  position: 0,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

const mutationQuery = (mutation: string, input: string) => `
  mutation {
    ${mutation}(input: ${input}) {
      responseOrError {
        ... on CityArticleMutationSuccess {
          citySlug
          articles {
            position
            article { internalID title }
          }
        }
        ... on CityArticleMutationFailure {
          mutationError { message }
        }
      }
    }
  }
`

describe("createCityArticle", () => {
  it("attaches an article and returns the city's refreshed article list", async () => {
    const createCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityArticlesLoader = jest.fn().mockResolvedValue([gravityJoin])
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const data = await runQuery(
      mutationQuery(
        "createCityArticle",
        '{ citySlug: "london-united-kingdom", articleID: "article-1" }'
      ),
      { createCityArticleLoader, cityArticlesLoader, articlesLoader }
    )

    expect(createCityArticleLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
      article_id: "article-1",
    })
    expect(cityArticlesLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
    })
    expect(data.createCityArticle.responseOrError).toEqual({
      citySlug: "london-united-kingdom",
      articles: [
        {
          position: 0,
          article: { internalID: "article-1", title: "London Art Week Guide" },
        },
      ],
    })
  })

  it("succeeds even when the attached article isn't published yet", async () => {
    const createCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityArticlesLoader = jest.fn().mockResolvedValue([gravityJoin])
    const articlesLoader = jest.fn().mockResolvedValue({ results: [] })

    const data = await runQuery(
      mutationQuery(
        "createCityArticle",
        '{ citySlug: "london-united-kingdom", articleID: "article-1" }'
      ),
      { createCityArticleLoader, cityArticlesLoader, articlesLoader }
    )

    expect(data.createCityArticle.responseOrError).toEqual({
      citySlug: "london-united-kingdom",
      articles: [],
    })
  })

  it("returns a mutation error when the loader is unavailable", async () => {
    await expect(
      runQuery(
        mutationQuery(
          "createCityArticle",
          '{ citySlug: "london-united-kingdom", articleID: "article-1" }'
        ),
        {}
      )
    ).rejects.toThrow("You need to be signed in to perform this action")
  })

  it("returns a GravityMutationError when gravity rejects the attach", async () => {
    const createCityArticleLoader = jest
      .fn()
      .mockRejectedValue(
        new HTTPError(
          "Article ID has already been taken",
          400,
          JSON.stringify({ error: "Article ID has already been taken" })
        )
      )

    const data = await runQuery(
      mutationQuery(
        "createCityArticle",
        '{ citySlug: "london-united-kingdom", articleID: "article-1" }'
      ),
      { createCityArticleLoader }
    )

    expect(
      data.createCityArticle.responseOrError.mutationError.message
    ).toEqual("Article ID has already been taken")
  })
})

describe("updateCityArticle", () => {
  it("moves an article and returns the city's refreshed article list", async () => {
    const updateCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityArticlesLoader = jest.fn().mockResolvedValue([gravityJoin])
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [{ id: "article-1", title: "London Art Week Guide" }],
    })

    const data = await runQuery(
      mutationQuery(
        "updateCityArticle",
        '{ id: "article-join-1", position: 0 }'
      ),
      { updateCityArticleLoader, cityArticlesLoader, articlesLoader }
    )

    expect(updateCityArticleLoader).toHaveBeenCalledWith("article-join-1", {
      position: 0,
    })
    expect(data.updateCityArticle.responseOrError.citySlug).toEqual(
      "london-united-kingdom"
    )
  })
})

describe("deleteCityArticle", () => {
  it("detaches an article and returns the city's remaining article list", async () => {
    const deleteCityArticleLoader = jest.fn().mockResolvedValue(gravityJoin)
    const cityArticlesLoader = jest.fn().mockResolvedValue([])
    const articlesLoader = jest.fn().mockResolvedValue({ results: [] })

    const data = await runQuery(
      mutationQuery("deleteCityArticle", '{ id: "article-join-1" }'),
      { deleteCityArticleLoader, cityArticlesLoader, articlesLoader }
    )

    expect(deleteCityArticleLoader).toHaveBeenCalledWith("article-join-1", {})
    expect(data.deleteCityArticle.responseOrError).toEqual({
      citySlug: "london-united-kingdom",
      articles: [],
    })
  })
})
