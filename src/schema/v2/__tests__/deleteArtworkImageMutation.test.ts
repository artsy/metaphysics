import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("DeleteArtworkImageMutation", () => {
  const mutation = gql`
    mutation {
      deleteArtworkImage(input: { artworkID: "foo", imageID: "image1" }) {
        artworkOrError {
          ... on ArtworkMutationDeleteSuccess {
            success
          }
          ... on ArtworkMutationFailure {
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
      deleteArtworkImageLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/my_collection/artworks/foo - {"error":"Error deleting artwork image"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      deleteArtworkImage: {
        artworkOrError: {
          mutationError: {
            message: "Error deleting artwork image",
          },
        },
      },
    })
  })

  it("deletes an artwork image", async () => {
    const context = {
      deleteArtworkImageLoader: () => Promise.resolve({ deleted: true }),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      deleteArtworkImage: {
        artworkOrError: {
          success: true,
        },
      },
    })
  })
})
