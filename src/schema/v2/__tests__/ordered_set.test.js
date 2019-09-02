/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

xdescribe("OrderedSet type", () => {
  it("fetches set by id", () => {
    const query = `
      {
        orderedSet(id: "52dd3c2e4b8480091700027f") {
          internalID
          name
          key
          description
          artworks: items {
            ... on Artwork {
              title
            }
          }
        }
      }
    `

    const context = {
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

    return runQuery(query, context).then(data => {
      expect(data).toEqual({
        orderedSet: {
          internalID: "52dd3c2e4b8480091700027f",
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
