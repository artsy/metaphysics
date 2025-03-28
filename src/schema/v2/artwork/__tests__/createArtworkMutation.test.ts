import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkMutation", () => {
  const mutation = gql`
    mutation {
      createArtwork(
        input: {
          partnerId: "partner123"
          artistIds: ["artist123", "artist456"]
          imageS3Bucket: "artwork-images"
          imageS3Key: "artworks/new_artwork.jpg"
        }
      ) {
        artworkOrError {
          __typename
          ... on CreateArtworkSuccess {
            artwork {
              internalID
            }
          }
          ... on CreateArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates an artwork with an image", async () => {
    const mockArtwork = {
      _id: "artwork123",
    }

    const context = {
      artworkLoader: () => Promise.resolve(mockArtwork),
      createArtworkLoader: (data) => {
        expect(data).toEqual({
          artists: ["artist123", "artist456"],
          partner: "partner123",
        })

        return Promise.resolve(mockArtwork)
      },
      addImageToArtworkLoader: (artworkId, data) => {
        expect(artworkId).toEqual("artwork123")
        expect(data).toEqual({
          source_bucket: "artwork-images",
          source_key: "artworks/new_artwork.jpg",
        })

        return Promise.resolve({})
      },
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtwork: {
        artworkOrError: {
          __typename: "CreateArtworkSuccess",
          artwork: {
            internalID: "artwork123",
          },
        },
      },
    })
  })
})
