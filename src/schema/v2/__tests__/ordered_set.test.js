import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("OrderedSet type", () => {
  it("fetches set by id", async () => {
    const query = gql`
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
      setLoader: jest.fn(() =>
        Promise.resolve({
          description: "",
          id: "52dd3c2e4b8480091700027f",
          item_type: "Artwork",
          key: "artworks:featured-artworks",
          name: "Featured Artworks",
        })
      ),
      setItemsLoader: jest.fn(() =>
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

    const data = await runQuery(query, context)

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

  it("can return a connection for an artwork set", async () => {
    const query = gql`
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
      setLoader: jest.fn(() =>
        Promise.resolve({
          description: "",
          id: "52dd3c2e4b8480091700027f",
          item_type: "Artwork",
          key: "artworks:featured-artworks",
          name: "Featured Artworks",
        })
      ),
      setItemsLoader: jest.fn(() =>
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

    const data = await runQuery(query, context)

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
