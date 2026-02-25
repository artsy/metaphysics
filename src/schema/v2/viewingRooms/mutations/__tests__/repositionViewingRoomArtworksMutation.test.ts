import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionViewingRoomArtworksMutation", () => {
  const mutation = gql`
    mutation {
      repositionViewingRoomArtworks(
        input: {
          viewingRoomID: "viewing-room-123"
          artworkIDs: ["artwork3", "artwork1", "artwork2"]
        }
      ) {
        viewingRoomArtworksOrError {
          __typename
          ... on RepositionViewingRoomArtworksSuccess {
            artworkIDs
          }
          ... on RepositionViewingRoomArtworksFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("repositions artworks in a viewing room", async () => {
    const context = {
      repositionViewingRoomArtworksLoader: (id, data) => {
        expect(id).toEqual("viewing-room-123")
        expect(data).toEqual({
          artwork_ids: ["artwork3", "artwork1", "artwork2"],
        })

        return Promise.resolve({
          artwork_ids: ["artwork3", "artwork1", "artwork2"],
        })
      },
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionViewingRoomArtworks: {
        viewingRoomArtworksOrError: {
          __typename: "RepositionViewingRoomArtworksSuccess",
          artworkIDs: ["artwork3", "artwork1", "artwork2"],
        },
      },
    })
  })

  it("returns an error when the mutation fails", async () => {
    const context = {
      repositionViewingRoomArtworksLoader: () => {
        return Promise.reject(new Error('403 - {"error":"Unauthorized"}'))
      },
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionViewingRoomArtworks: {
        viewingRoomArtworksOrError: {
          __typename: "RepositionViewingRoomArtworksFailure",
          mutationError: {
            message: "Unauthorized",
          },
        },
      },
    })
  })
})
