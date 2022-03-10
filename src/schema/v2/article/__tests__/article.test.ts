import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Article", () => {
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
})
