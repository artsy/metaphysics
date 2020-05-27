/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("OrderedSet type", () => {
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
        Promise.resolve({
          body: [
            {
              title: "My Artwork",
            },
            {
              title: "Another Artwork",
            },
          ],
          headers: {},
        })
      ),
    }

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        orderedSet: {
          internalID: "52dd3c2e4b8480091700027f",
          name: "Featured Artworks",
          description: null,
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

  it("can return a connection for an artwork set", () => {
    const query = `
      {
        orderedSet(id: "52dd3c2e4b8480091700027f") {
          itemsConnection(first: 2) {
            edges {
              node {
                title
              }
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
        Promise.resolve({
          body: [
            {
              title: "My Artwork",
            },
            {
              title: "Another Artwork",
            },
          ],
          headers: {
            "x-total-count": 11,
          },
        })
      ),
    }

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        orderedSet: {
          itemsConnection: {
            edges: [
              {
                node: {
                  title: "My Artwork",
                },
              },
              {
                node: {
                  title: "Another Artwork",
                },
              },
            ],
          },
        },
      })
    })
  })
})
