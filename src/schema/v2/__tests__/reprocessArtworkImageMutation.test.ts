import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("ReprocessArtworkImageMutation", () => {
  const mutation = gql`
    mutation {
      reprocessArtworkImage(input: { artworkID: "artwork-id", imageID: "image-id" }) {
        artworkOrError {
          ... on ReprocessArtworkImageSuccess {
            success
          }
          ... on ReprocessArtworkImageFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("reprocesses an artwork image", async () => {
    const context = {
      updateArtworkImageLoader: () => Promise.resolve({}),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      reprocessArtworkImage: {
        artworkOrError: {
          success: true,
        },
      },
    })
  })

  it("returns a formatted error when Gravity fails", async () => {
    console.error = jest.fn()

    const context = {
      updateArtworkImageLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/artwork/artwork-id/image/image-id - {"error":"Unable to reprocess image"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual({
      reprocessArtworkImage: {
        artworkOrError: {
          mutationError: {
            message: "Unable to reprocess image",
          },
        },
      },
    })
  })
})

