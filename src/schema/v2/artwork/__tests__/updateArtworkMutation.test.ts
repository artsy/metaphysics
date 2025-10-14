import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkMutation", () => {
  const mutation = gql`
    mutation {
      updateArtwork(
        input: {
          id: "25"
          availability: "sold"
          ecommerce: true
          offer: true
          priceListed: "1000"
          priceHidden: false
          displayPriceRange: false
        }
      ) {
        artworkOrError {
          __typename
          ... on updateArtworkSuccess {
            artwork {
              availability
              isAcquireable
              isOfferable
              price
              priceDisplay
              displayPriceRange
            }
          }
          ... on updateArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates an artwork", async () => {
    const context = {
      updateArtworkLoader: () =>
        Promise.resolve({
          id: "25",
          availability: "sold",
          acquireable: true,
          offerable: true,
          price: "$1000",
          price_display: "exact",
          display_price_range: false,
        }),
    }

    const artwork = await runAuthenticatedQuery(mutation, context)

    expect(artwork).toEqual({
      updateArtwork: {
        artworkOrError: {
          __typename: "updateArtworkSuccess",
          artwork: {
            availability: "sold",
            isAcquireable: true,
            isOfferable: true,
            price: "$1000",
            priceDisplay: "exact",
            displayPriceRange: false,
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        updateArtworkLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/some-endpoint - {"type":"error","message":"Error from API"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        updateArtwork: {
          artworkOrError: {
            __typename: "updateArtworkFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })

  describe("image handling", () => {
    const imageUpdateMutation = gql`
      mutation {
        updateArtwork(
          input: {
            id: "25"
            imageS3Locations: [
              { bucket: "bucket1", key: "key1.jpg" }
              { bucket: "bucket2", key: "key2.jpg" }
            ]
          }
        ) {
          artworkOrError {
            __typename
            ... on updateArtworkSuccess {
              artwork {
                id
              }
            }
            ... on updateArtworkFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("adds multiple images to artwork", async () => {
      const addImageToArtworkLoader = jest.fn().mockResolvedValue({})
      const context = {
        updateArtworkLoader: () =>
          Promise.resolve({
            id: "25",
          }),
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(imageUpdateMutation, context)

      expect(addImageToArtworkLoader).toHaveBeenCalledTimes(2)
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("25", {
        source_bucket: "bucket1",
        source_key: "key1.jpg",
      })
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("25", {
        source_bucket: "bucket2",
        source_key: "key2.jpg",
      })
    })

    it("handles multiple S3 locations correctly", async () => {
      const multiLocationMutation = gql`
        mutation {
          updateArtwork(
            input: {
              id: "25"
              imageS3Locations: [
                { bucket: "bucket1", key: "image1.jpg" }
                { bucket: "bucket2", key: "image2.jpg" }
                { bucket: "bucket1", key: "image3.jpg" }
              ]
            }
          ) {
            artworkOrError {
              __typename
              ... on updateArtworkSuccess {
                artwork {
                  id
                }
              }
            }
          }
        }
      `

      const addImageToArtworkLoader = jest.fn().mockResolvedValue({})
      const context = {
        updateArtworkLoader: () => Promise.resolve({ id: "25" }),
        updateArtworkEditionSetLoader: jest.fn(),
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(multiLocationMutation, context)

      expect(addImageToArtworkLoader).toHaveBeenCalledTimes(3)
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("25", {
        source_bucket: "bucket1",
        source_key: "image1.jpg",
      })
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("25", {
        source_bucket: "bucket2",
        source_key: "image2.jpg",
      })
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("25", {
        source_bucket: "bucket1",
        source_key: "image3.jpg",
      })
    })

    it("handles empty S3 locations array gracefully", async () => {
      const emptyLocationsMutation = gql`
        mutation {
          updateArtwork(
            input: { id: "25", imageS3Locations: [], availability: "sold" }
          ) {
            artworkOrError {
              __typename
              ... on updateArtworkSuccess {
                artwork {
                  id
                }
              }
            }
          }
        }
      `

      const addImageToArtworkLoader = jest.fn()
      const context = {
        updateArtworkLoader: () => Promise.resolve({ id: "25" }),
        updateArtworkEditionSetLoader: jest.fn(),
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(emptyLocationsMutation, context)

      expect(addImageToArtworkLoader).not.toHaveBeenCalled()
    })

    it("works with single S3 location", async () => {
      const singleLocationMutation = gql`
        mutation {
          updateArtwork(
            input: {
              id: "25"
              imageS3Locations: [
                { bucket: "my-bucket", key: "single-image.jpg" }
              ]
            }
          ) {
            artworkOrError {
              __typename
              ... on updateArtworkSuccess {
                artwork {
                  id
                }
              }
            }
          }
        }
      `

      const addImageToArtworkLoader = jest.fn().mockResolvedValue({})
      const context = {
        updateArtworkLoader: () => Promise.resolve({ id: "25" }),
        updateArtworkEditionSetLoader: jest.fn(),
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(singleLocationMutation, context)

      expect(addImageToArtworkLoader).toHaveBeenCalledTimes(1)
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("25", {
        source_bucket: "my-bucket",
        source_key: "single-image.jpg",
      })
    })

    it("skips image processing when no images provided", async () => {
      const noImageMutation = gql`
        mutation {
          updateArtwork(input: { id: "25", availability: "sold" }) {
            artworkOrError {
              __typename
              ... on updateArtworkSuccess {
                artwork {
                  id
                }
              }
            }
          }
        }
      `

      const addImageToArtworkLoader = jest.fn()
      const context = {
        updateArtworkLoader: () => Promise.resolve({ id: "25" }),
        updateArtworkEditionSetLoader: jest.fn(),
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(noImageMutation, context)

      expect(addImageToArtworkLoader).not.toHaveBeenCalled()
    })
  })

  describe("default image handling", () => {
    const defaultImageMutation = gql`
      mutation {
        updateArtwork(input: { id: "25", defaultImageID: "image-123" }) {
          artworkOrError {
            __typename
            ... on updateArtworkSuccess {
              artwork {
                id
              }
            }
            ... on updateArtworkFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("sets the default image when defaultImageID is provided", async () => {
      const setDefaultArtworkImageLoader = jest.fn().mockResolvedValue({})
      const context = {
        updateArtworkLoader: () => Promise.resolve({ id: "25" }),
        updateArtworkEditionSetLoader: jest.fn(),
        setDefaultArtworkImageLoader,
      }

      await runAuthenticatedQuery(defaultImageMutation, context)

      expect(setDefaultArtworkImageLoader).toHaveBeenCalledTimes(1)
      expect(setDefaultArtworkImageLoader).toHaveBeenCalledWith({
        artworkId: "25",
        imageId: "image-123",
      })
    })

    it("skips setting default image when defaultImageID is not provided", async () => {
      const noDefaultImageMutation = gql`
        mutation {
          updateArtwork(input: { id: "25", availability: "sold" }) {
            artworkOrError {
              __typename
              ... on updateArtworkSuccess {
                artwork {
                  id
                }
              }
            }
          }
        }
      `

      const setDefaultArtworkImageLoader = jest.fn()
      const context = {
        updateArtworkLoader: () => Promise.resolve({ id: "25" }),
        updateArtworkEditionSetLoader: jest.fn(),
        setDefaultArtworkImageLoader,
      }

      await runAuthenticatedQuery(noDefaultImageMutation, context)

      expect(setDefaultArtworkImageLoader).not.toHaveBeenCalled()
    })
  })
})
