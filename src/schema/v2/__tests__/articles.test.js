/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Articles type", () => {
  let context = null

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

    context = {
      articlesLoader: sinon
        .stub()
        .returns(Promise.resolve({ results: [article] })),
    }
  })

  it("fetches articles", () => {
    const query = `
      {
        articles {
          slug
          title
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.articles[0].slug).toBe("foo-bar")
      expect(data.articles[0].title).toBe("My Awesome Article")
    })
  })
})
