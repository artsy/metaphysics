import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkMutation", () => {
  const basicMutation = gql`
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

  const mutationWithShow = gql`
    mutation {
      createArtwork(
        input: {
          partnerId: "partner123"
          artistIds: ["artist123", "artist456"]
          imageS3Bucket: "artwork-images"
          imageS3Key: "artworks/new_artwork.jpg"
          partnerShowId: "show123"
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

  const mutationWithMultipleImages = gql`
    mutation {
      createArtwork(
        input: {
          partnerId: "partner123"
          artistIds: ["artist123", "artist456"]
          imageS3Buckets: ["bucket1", "bucket2"]
          imageS3Keys: ["key1", "key2"]
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
    const mockArtwork = { _id: "artwork123" }

    const context = {
      artworkLoader: () => Promise.resolve(mockArtwork),
      createArtworkLoader: (data) => {
        expect(data).toEqual({
          artists: ["artist123", "artist456"],
          partner: "partner123",
          sync_to_search: true,
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
      addArtworkToPartnerShowLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(basicMutation, context)

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

    expect(context.addArtworkToPartnerShowLoader).not.toHaveBeenCalled()
  })

  it("creates an artwork with an image and adds it to a partner show", async () => {
    const mockArtwork = { _id: "artwork123" }
    const addArtworkToPartnerShowLoaderMock = jest.fn().mockResolvedValue({})

    const context = {
      artworkLoader: () => Promise.resolve(mockArtwork),
      createArtworkLoader: (data) => {
        expect(data).toEqual({
          artists: ["artist123", "artist456"],
          partner: "partner123",
          sync_to_search: true,
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
      addArtworkToPartnerShowLoader: addArtworkToPartnerShowLoaderMock,
    }

    const result = await runAuthenticatedQuery(mutationWithShow, context)

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

    expect(addArtworkToPartnerShowLoaderMock).toHaveBeenCalledWith({
      showId: "show123",
      artworkId: "artwork123",
      partnerId: "partner123",
    })
  })

  it("creates an artwork with multiple images", async () => {
    const mockArtwork = { _id: "artwork123" }
    const createArtworkLoaderMock = jest.fn().mockImplementation((data) => {
      expect(data).toEqual({
        artists: ["artist123", "artist456"],
        partner: "partner123",
        sync_to_search: true,
      })
      return Promise.resolve(mockArtwork)
    })
    const addImageToArtworkLoaderMock = jest.fn().mockResolvedValue({})
    const context = {
      artworkLoader: () => Promise.resolve(mockArtwork),
      createArtworkLoader: createArtworkLoaderMock,
      addImageToArtworkLoader: addImageToArtworkLoaderMock,
      addArtworkToPartnerShowLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(
      mutationWithMultipleImages,
      context
    )

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

    // Should call once per bucket/key pair
    expect(addImageToArtworkLoaderMock).toHaveBeenCalledTimes(2)
    expect(addImageToArtworkLoaderMock).toHaveBeenNthCalledWith(
      1,
      "artwork123",
      { source_bucket: "bucket1", source_key: "key1" }
    )
    expect(addImageToArtworkLoaderMock).toHaveBeenNthCalledWith(
      2,
      "artwork123",
      { source_bucket: "bucket2", source_key: "key2" }
    )

    // Should not add to a show
    expect(context.addArtworkToPartnerShowLoader).not.toHaveBeenCalled()
  })
})
