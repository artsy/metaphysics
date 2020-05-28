/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

xdescribe("Article type", () => {
  let article = null
  let context = null

  beforeEach(() => {
    article = {
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
    }

    context = {
      articleLoader: sinon.stub().returns(Promise.resolve(article)),
    }
  })

  it("fetches an article by ID", () => {
    const query = `
      {
        article(id: "foo-bar") {
          slug
          title
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.article.slug).toBe("foo-bar")
      expect(data.article.title).toBe("My Awesome Article")
    })
  })

  it("returns an array of contributing authors", () => {
    const query = `
      {
        article(id: "foo-bar") {
          slug
          title
          contributingAuthors {
            internalID
            name
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.article.slug).toBe("foo-bar")
      expect(data.article.title).toBe("My Awesome Article")
      expect(data.article.contributingAuthors).toEqual([
        { internalID: "contrib-1", name: "Contributing Author 1" },
        { internalID: "contrib-2", name: "Contributing Author 2" },
      ])
    })
  })
})
