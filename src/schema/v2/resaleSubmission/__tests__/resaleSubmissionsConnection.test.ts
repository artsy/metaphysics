import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  meLoader,
  stubLoaders,
} from "./fixtures"

const OTHER_MARKETPLACE_ARTWORK_ID = "5f00000000000000000000c0"

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
  it("lists the sellable My Collection works and skips rejected ones", async () => {
    const myCollectionArtworksLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          { _id: MARKETPLACE_ARTWORK_ID, id: "work-1" },
          { _id: REJECTED_ARTWORK_ID, id: "work-2" },
          { _id: AUCTION_ARTWORK_ID, id: "work-3" },
          { _id: OTHER_MARKETPLACE_ARTWORK_ID, id: "work-4" },
        ],
        headers: { "x-total-count": "4" },
      })
    )
    const artworkLoader = jest.fn()

    const { me } = await runAuthenticatedQuery(query, {
      meLoader,
      ...stubLoaders(myCollectionArtworksLoader),
      artworkLoader,
    } as any)

    expect(myCollectionArtworksLoader).toHaveBeenCalledWith({
      user_id: "user-42",
      private: true,
      all: true,
      sort: "-position",
      page: 1,
      size: 100,
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
