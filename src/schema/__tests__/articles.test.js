/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Articles type", () => {
  let rootValue = null

  beforeEach(() => {
    const article = {
      id: "foo-bar",
      slug: "foo-bar",
      title: "My Awesome Article",
      author: {
        id: "author1",
        name: "First Author",
      },
    }

    rootValue = {
      articlesLoader: sinon
        .stub()
        .returns(Promise.resolve({ results: [article] })),
    }
  })

  it("fetches articles", () => {
    const query = `
      {
        articles {
          id
          title
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data.articles[0].id).toBe("foo-bar")
      expect(data.articles[0].title).toBe("My Awesome Article")
    })
  })
})
