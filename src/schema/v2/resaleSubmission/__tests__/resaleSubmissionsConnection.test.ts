import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  meLoader,
  stubLoaders,
} from "./fixtures"

const query = gql`
  {
    me {
      resaleSubmissionsConnection(first: 2) {
        totalCount
        pageInfo {
          hasNextPage
        }
        edges {
          node {
            internalID
            channel
            submittedArtwork {
              internalID
            }
          }
        }
      }
    }
  }
`

describe("me.resaleSubmissionsConnection", () => {
  it("returns one submission per My Collection work on the page", async () => {
    const myCollectionArtworksLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          { _id: MARKETPLACE_ARTWORK_ID, id: "work-1" },
          { _id: AUCTION_ARTWORK_ID, id: "work-2" },
        ],
        headers: { "x-total-count": "3" },
      })
    )
    const artworkLoader = jest.fn()

    const { me } = await runAuthenticatedQuery(query, {
      meLoader,
      ...stubLoaders(myCollectionArtworksLoader),
      artworkLoader,
    } as any)

    expect(myCollectionArtworksLoader).toHaveBeenCalledWith({
      page: 1,
      size: 2,
      offset: 0,
      total_count: true,
      user_id: "user-42",
      private: true,
      all: true,
      sort: "-position",
    })
    expect(me.resaleSubmissionsConnection).toEqual({
      totalCount: 3,
      pageInfo: { hasNextPage: true },
      edges: [
        {
          node: {
            internalID: `stub-${MARKETPLACE_ARTWORK_ID}`,
            channel: "MARKETPLACE",
            submittedArtwork: { internalID: MARKETPLACE_ARTWORK_ID },
          },
        },
        {
          node: {
            internalID: `stub-${AUCTION_ARTWORK_ID}`,
            channel: "AUCTION",
            submittedArtwork: { internalID: AUCTION_ARTWORK_ID },
          },
        },
      ],
    })
    expect(artworkLoader).not.toHaveBeenCalled()
  })

  it("is empty when the user has no My Collection", async () => {
    const myCollectionArtworksLoader = jest.fn(() =>
      Promise.reject(new HTTPError("Not Found", 404))
    )

    const { me } = await runAuthenticatedQuery(query, {
      meLoader,
      ...stubLoaders(myCollectionArtworksLoader),
    } as any)

    expect(me.resaleSubmissionsConnection.edges).toEqual([])
  })

  it("is null when signed out", async () => {
    const { me } = await runQuery(
      gql`
        {
          me {
            resaleSubmissionsConnection(first: 2) {
              totalCount
            }
          }
        }
      `,
      { meLoader }
    )

    expect(me.resaleSubmissionsConnection).toBeNull()
  })
})
