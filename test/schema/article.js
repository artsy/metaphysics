import schema from "schema"
import { runQuery } from "test/utils"

describe("Article type", () => {
  const Article = schema.__get__("Article")
  let positron = null

  beforeEach(() => {
    positron = sinon.stub()

    positron.returns(
      Promise.resolve({
        id: "foo-bar",
        slug: "foo-bar",
        title: "My Awesome Article",
        thumbnail_title: "Tiny Thumbnail",
        thumbnail_image: {
          url: "tiny_thumbnail.jpg",
        },
        published_at: "2017-01-26T00:26:57.928Z",
        channel_id: "abc123",
        author: {
          id: "author1",
          name: "First Author",
        },
        contributing_authors: [
          {
            id: "contrib-1",
            name: "Contributing Author 1",
          },
          {
            id: "contrib-2",
            name: "Contributing Author 2",
          },
        ],
      })
    )

    Article.__Rewire__("positron", positron)
  })

  afterEach(() => {
    Article.__ResetDependency__("positron")
  })

  it("fetches an article by ID", () => {
    return runQuery(`{ article(id: "foo-bar") { id, title } }`).then(data => {
      expect(data.article.id).toBe("foo-bar")
      expect(data.article.title).toBe("My Awesome Article")
    })
  })

  it("returns an array of contributing authors", () => {
    return runQuery(`{ article(id: "foo-bar") { id, title, contributing_authors{ id, name } } }`).then(data => {
      expect(data.article.id).toBe("foo-bar")
      expect(data.article.title).toBe("My Awesome Article")
      expect(data.article.contributing_authors).toEqual([
        { id: "contrib-1", name: "Contributing Author 1" },
        { id: "contrib-2", name: "Contributing Author 2" },
      ])
    })
  })
})
