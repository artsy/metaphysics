import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionArtworkImagesMutation", () => {
  const mutation = gql`
    mutation {
      repositionArtworkImages(
        input: {
          artworkId: "artwork123"
          imageIds: ["image1", "image2", "image3"]
        }
      ) {
        artworkOrError {
          __typename
          ... on RepositionArtworkImagesSuccess {
            artwork {
              internalID
              title
            }
          }
          ... on RepositionArtworkImagesFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("repositions images in an artwork", async () => {
    const context = {
      repositionArtworkImagesLoader: (identifiers, data) => {
        // Test that we're sending the right data
        expect(identifiers).toEqual({
          artworkId: "artwork123",
        })
        expect(data).toEqual({
          image_ids: ["image1", "image2", "image3"],
        })

        return Promise.resolve({})
      },
      artworkLoader: () =>
        Promise.resolve({
          _id: "artwork123",
          title: "Sample Artwork",
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionArtworkImages: {
        artworkOrError: {
          __typename: "RepositionArtworkImagesSuccess",
          artwork: {
            internalID: "artwork123",
            title: "Sample Artwork",
          },
        },
      },
    })
  })
})
