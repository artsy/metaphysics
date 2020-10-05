import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("myCollectionDeleteArtworkMutation", () => {
  const mutation = gql`
    mutation {
      myCollectionDeleteArtwork(input: { artworkId: "foo" }) {
        artworkOrError {
          ... on MyCollectionArtworkMutationDeleteSuccess {
            success
          }
          ... on MyCollectionArtworkMutationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("returns an error", async () => {
    const context = {
      deleteArtworkLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/my_collection/artworks/foo - {"error":"Error deleting artwork"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionDeleteArtwork: {
        artworkOrError: {
          mutationError: {
            message: "Error deleting artwork",
          },
        },
      },
    })
  })

  it("deletes an artwork", async () => {
    const context = {
      deleteArtworkLoader: () => Promise.resolve({ deleted: true }),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionDeleteArtwork: {
        artworkOrError: {
          success: true,
        },
      },
    })
  })
})
