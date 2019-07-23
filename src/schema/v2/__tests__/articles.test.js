/* eslint-disable promise/always-return */
import { runV2Query } from "test/utils"

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
          id
          title
        }
      }
    `

    return runV2Query(query, context).then(data => {
      expect(data.articles[0].id).toBe("foo-bar")
      expect(data.articles[0].title).toBe("My Awesome Article")
    })
  })
})
