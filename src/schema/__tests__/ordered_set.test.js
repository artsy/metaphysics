/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("OrderedSet type", () => {
  it("fetches set by id", () => {
    const query = `
      {
        ordered_set(id: "52dd3c2e4b8480091700027f") {
          id
          name
          key
          description
          artworks: items {
            ... on ArtworkItem {
              title
            }
          }
        }
      }
    `

    const rootValue = {
      setLoader: sinon.stub().returns(
        Promise.resolve({
          description: "",
          id: "52dd3c2e4b8480091700027f",
          item_type: "Artwork",
          key: "artworks:featured-artworks",
          name: "Featured Artworks",
        })
      ),
      setItemsLoader: sinon.stub().returns(
        Promise.resolve([
          {
            title: "My Artwork",
          },
          {
            title: "Another Artwork",
          },
        ])
      ),
    }

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        ordered_set: {
          id: "52dd3c2e4b8480091700027f",
          name: "Featured Artworks",
          description: "",
          key: "artworks:featured-artworks",
          artworks: [
            {
              title: "My Artwork",
            },
            {
              title: "Another Artwork",
            },
          ],
        },
      })
    })
  })
})
