import jwt from "jwt-simple"
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const encodeToken = (roles: string) => jwt.encode({ roles }, "test-secret")

describe("Article", () => {
  describe("loader selection", () => {
    const query = gql`
      {
        article(id: "draft-article-id") {
          title
        }
      }
    `

    it("uses the public articleLoader for unauthenticated requests", async () => {
      const articleLoader = jest.fn(() =>
        Promise.resolve({ title: "Draft Article" })
      )

      await runQuery(query, { articleLoader })

      expect(articleLoader).toHaveBeenCalledWith("draft-article-id")
    })

    it("uses the public articleLoader for authenticated non-editorial users", async () => {
      const articleLoader = jest.fn(() =>
        Promise.resolve({ title: "Draft Article" })
      )
      const authenticatedArticleLoader = jest.fn()

      await runQuery(query, {
        articleLoader,
        authenticatedArticleLoader,
        accessToken: encodeToken("partner"),
      })

      expect(articleLoader).toHaveBeenCalledWith("draft-article-id")
      expect(authenticatedArticleLoader).not.toHaveBeenCalled()
    })

    it("falls back to the public articleLoader when the JWT is malformed", async () => {
      const articleLoader = jest.fn(() =>
        Promise.resolve({ title: "Published Article" })
      )
      const authenticatedArticleLoader = jest.fn()

      await runQuery(query, {
        articleLoader,
        authenticatedArticleLoader,
        accessToken: "not-a-valid-jwt",
      })

      expect(articleLoader).toHaveBeenCalledWith("draft-article-id")
      expect(authenticatedArticleLoader).not.toHaveBeenCalled()
    })

    it("uses the authenticatedArticleLoader for editorial users", async () => {
      const articleLoader = jest.fn()
      const authenticatedArticleLoader = jest.fn(() =>
        Promise.resolve({ title: "Draft Article" })
      )

      await runQuery(query, {
        articleLoader,
        authenticatedArticleLoader,
        accessToken: encodeToken("editorial"),
      })

      expect(authenticatedArticleLoader).toHaveBeenCalledWith(
        "draft-article-id"
      )
      expect(articleLoader).not.toHaveBeenCalled()
    })
  })

  it("returns the correct byline and authors", async () => {
    const query = gql`
      {
        article(id: "example") {
          byline
          authors {
            name
          }
        }
      }
    `

    const articleLoader = jest.fn(() =>
      Promise.resolve({ author_ids: ["1", "2", "3"] })
    )

    const authorsLoader = jest.fn(() =>
      Promise.resolve({
        results: [
          { name: "John Smith" },
          { name: "Jane Smith" },
          { name: "J. Random Hacker" },
        ],
      })
    )

    const { article } = await runQuery(query, { articleLoader, authorsLoader })

    expect(article).toEqual({
      byline: "John Smith, Jane Smith and J. Random Hacker",
      authors: [
        { name: "John Smith" },
        { name: "Jane Smith" },
        { name: "J. Random Hacker" },
      ],
    })
  })

  it("returns the correct byline and authors when there are none", async () => {
    const query = gql`
      {
        article(id: "example") {
          byline
          authors {
            name
          }
        }
      }
    `

    const articleLoader = jest.fn(() => Promise.resolve({ author_ids: [] }))

    const { article } = await runQuery(query, { articleLoader })

    expect(article).toEqual({
      byline: "Artsy Editors",
      authors: [],
    })
  })

  it("first fallsback to the author when there are no author_ids", async () => {
    const query = gql`
      {
        article(id: "example") {
          byline
          authors {
            name
          }
        }
      }
    `

    const articleLoader = jest.fn(() =>
      Promise.resolve({ author_ids: [], author: { name: "John Smith" } })
    )

    const { article } = await runQuery(query, { articleLoader })

    expect(article).toEqual({
      byline: "John Smith",
      authors: [],
    })
  })

  describe("outline", () => {
    const outlineQuery = gql`
      {
        article(id: "example") {
          outline {
            heading
            slug
          }
        }
      }
    `

    it("extracts h2 headings from text sections", async () => {
      const articleLoader = jest.fn(() =>
        Promise.resolve({
          sections: [
            { type: "image_collection" },
            {
              type: "text",
              body: '<h2>"Containing Multitudes"</h2><p>Some text</p>',
            },
            { type: "image_collection" },
            {
              type: "text",
              body: "<h2>Ties of Our Common Kindred</h2><h3>Subtitle</h3>",
            },
          ],
        })
      )

      const { article } = await runQuery(outlineQuery, { articleLoader })

      expect(article.outline).toEqual([
        {
          heading: '"Containing Multitudes"',
          slug: "containing-multitudes",
        },
        {
          heading: "Ties of Our Common Kindred",
          slug: "ties-of-our-common-kindred",
        },
      ])
    })

    it("returns an empty array when there are no h2 headings", async () => {
      const articleLoader = jest.fn(() =>
        Promise.resolve({
          sections: [
            { type: "text", body: "<p>No headings</p>" },
            { type: "image_collection" },
          ],
        })
      )

      const { article } = await runQuery(outlineQuery, { articleLoader })

      expect(article.outline).toEqual([])
    })

    it("returns an empty array when sections is missing", async () => {
      const articleLoader = jest.fn(() => Promise.resolve({}))

      const { article } = await runQuery(outlineQuery, { articleLoader })

      expect(article.outline).toEqual([])
    })

    it("deduplicates repeated heading slugs", async () => {
      const articleLoader = jest.fn(() =>
        Promise.resolve({
          sections: [
            { type: "text", body: "<h2>Overview</h2>" },
            { type: "text", body: "<h2>Overview</h2>" },
            { type: "text", body: "<h2>Overview</h2>" },
          ],
        })
      )

      const { article } = await runQuery(outlineQuery, { articleLoader })

      expect(article.outline).toEqual([
        { heading: "Overview", slug: "overview" },
        { heading: "Overview", slug: "overview-2" },
        { heading: "Overview", slug: "overview-3" },
      ])
    })
  })
})
