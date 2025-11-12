import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkFromTemplateMutation", () => {
  const mutation = gql`
    mutation {
      createArtworkFromTemplate(
        input: {
          partnerID: "partner123"
          artworkTemplateID: "template123"
          imageS3Bucket: "test-bucket"
          imageS3Key: "test-image.jpg"
        }
      ) {
        artworkOrError {
          __typename
          ... on CreateArtworkFromTemplateSuccess {
            artwork {
              internalID
              title
              artistNames
            }
          }
          ... on CreateArtworkFromTemplateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates an artwork from a template", async () => {
    const mockArtwork = {
      _id: "artwork789",
      title: "New Artwork from Template",
      artists: [{ name: "Andy Warhol" }],
    }

    const createArtworkFromTemplateLoader = jest
      .fn()
      .mockImplementation((pathParams) => {
        expect(pathParams).toEqual({
          partnerId: "partner123",
          templateId: "template123",
        })
        return Promise.resolve(mockArtwork)
      })

    const addImageToArtworkLoader = jest.fn().mockResolvedValue({})

    const context = { createArtworkFromTemplateLoader, addImageToArtworkLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkFromTemplate: {
        artworkOrError: {
          __typename: "CreateArtworkFromTemplateSuccess",
          artwork: {
            internalID: "artwork789",
            title: "New Artwork from Template",
            artistNames: "Andy Warhol",
          },
        },
      },
    })
  })

  it("handles errors when template does not exist", async () => {
    const createArtworkFromTemplateLoader = jest.fn().mockImplementation(() => {
      const error: any = new Error("Template not found")
      error.statusCode = 404
      error.body = {
        error: "Template not found",
        message: "The specified template does not exist",
      }
      throw error
    })

    const addImageToArtworkLoader = jest.fn().mockResolvedValue({})

    const context = { createArtworkFromTemplateLoader, addImageToArtworkLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkFromTemplate: {
        artworkOrError: {
          __typename: "CreateArtworkFromTemplateFailure",
          mutationError: {
            message: "Template not found",
          },
        },
      },
    })
  })

  it("handles errors when template does not belong to partner", async () => {
    const createArtworkFromTemplateLoader = jest.fn().mockImplementation(() => {
      const error: any = new Error("Template does not belong to partner")
      error.statusCode = 400
      error.body = {
        error: "Template does not belong to partner",
        message: "Template does not belong to partner",
      }
      throw error
    })

    const addImageToArtworkLoader = jest.fn().mockResolvedValue({})

    const context = { createArtworkFromTemplateLoader, addImageToArtworkLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkFromTemplate: {
        artworkOrError: {
          __typename: "CreateArtworkFromTemplateFailure",
          mutationError: {
            message: "Template does not belong to partner",
          },
        },
      },
    })
  })

  describe("image handling", () => {
    const imageTemplateMutation = gql`
      mutation {
        createArtworkFromTemplate(
          input: {
            partnerID: "partner123"
            artworkTemplateID: "template123"
            imageS3Buckets: ["bucket1", "bucket2"]
            imageS3Keys: ["key1.jpg", "key2.jpg"]
          }
        ) {
          artworkOrError {
            __typename
            ... on CreateArtworkFromTemplateSuccess {
              artwork {
                internalID
              }
            }
            ... on CreateArtworkFromTemplateFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("adds multiple images to artwork created from template", async () => {
      const mockArtwork = {
        _id: "artwork789",
        title: "New Artwork",
        artists: [{ name: "Andy Warhol" }],
      }

      const createArtworkFromTemplateLoader = jest
        .fn()
        .mockResolvedValue(mockArtwork)

      const addImageToArtworkLoader = jest.fn().mockResolvedValue({})

      const context = {
        createArtworkFromTemplateLoader,
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(imageTemplateMutation, context)

      expect(addImageToArtworkLoader).toHaveBeenCalledTimes(2)
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("artwork789", {
        source_bucket: "bucket1",
        source_key: "key1.jpg",
      })
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("artwork789", {
        source_bucket: "bucket2",
        source_key: "key2.jpg",
      })
    })

    it("supports singular image S3 bucket/key inputs", async () => {
      const singleImageMutation = gql`
        mutation {
          createArtworkFromTemplate(
            input: {
              partnerID: "partner123"
              artworkTemplateID: "template123"
              imageS3Bucket: "my-bucket"
              imageS3Key: "my-image.jpg"
            }
          ) {
            artworkOrError {
              __typename
              ... on CreateArtworkFromTemplateSuccess {
                artwork {
                  internalID
                }
              }
            }
          }
        }
      `

      const mockArtwork = {
        _id: "artwork789",
        title: "New Artwork",
        artists: [{ name: "Andy Warhol" }],
      }

      const createArtworkFromTemplateLoader = jest
        .fn()
        .mockResolvedValue(mockArtwork)

      const addImageToArtworkLoader = jest.fn().mockResolvedValue({})

      const context = {
        createArtworkFromTemplateLoader,
        addImageToArtworkLoader,
      }

      await runAuthenticatedQuery(singleImageMutation, context)

      expect(addImageToArtworkLoader).toHaveBeenCalledTimes(1)
      expect(addImageToArtworkLoader).toHaveBeenCalledWith("artwork789", {
        source_bucket: "my-bucket",
        source_key: "my-image.jpg",
      })
    })

    it("creates artwork from template without images", async () => {
      const noImageMutation = gql`
        mutation {
          createArtworkFromTemplate(
            input: { partnerID: "partner123", artworkTemplateID: "template123" }
          ) {
            artworkOrError {
              __typename
              ... on CreateArtworkFromTemplateSuccess {
                artwork {
                  internalID
                  title
                  artistNames
                }
              }
              ... on CreateArtworkFromTemplateFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      const mockArtwork = {
        _id: "artwork789",
        title: "New Artwork from Template",
        artists: [{ name: "Andy Warhol" }],
      }

      const createArtworkFromTemplateLoader = jest
        .fn()
        .mockImplementation((pathParams) => {
          expect(pathParams).toEqual({
            partnerId: "partner123",
            templateId: "template123",
          })
          return Promise.resolve(mockArtwork)
        })

      const addImageToArtworkLoader = jest.fn()

      const context = {
        createArtworkFromTemplateLoader,
        addImageToArtworkLoader,
      }

      const result = await runAuthenticatedQuery(noImageMutation, context)

      expect(result).toEqual({
        createArtworkFromTemplate: {
          artworkOrError: {
            __typename: "CreateArtworkFromTemplateSuccess",
            artwork: {
              internalID: "artwork789",
              title: "New Artwork from Template",
              artistNames: "Andy Warhol",
            },
          },
        },
      })

      expect(createArtworkFromTemplateLoader).toHaveBeenCalledWith({
        partnerId: "partner123",
        templateId: "template123",
      })
      expect(addImageToArtworkLoader).not.toHaveBeenCalled()
    })

    it("returns error when bucket provided but no key", async () => {
      const noBucketMutation = gql`
        mutation {
          createArtworkFromTemplate(
            input: {
              partnerID: "partner123"
              artworkTemplateID: "template123"
              imageS3Bucket: "my-bucket"
            }
          ) {
            artworkOrError {
              __typename
              ... on CreateArtworkFromTemplateFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      const createArtworkFromTemplateLoader = jest.fn()
      const addImageToArtworkLoader = jest.fn()

      const context = {
        createArtworkFromTemplateLoader,
        addImageToArtworkLoader,
      }

      const result = await runAuthenticatedQuery(noBucketMutation, context)

      expect(result.createArtworkFromTemplate.artworkOrError.__typename).toBe(
        "CreateArtworkFromTemplateFailure"
      )
      expect(
        result.createArtworkFromTemplate.artworkOrError.mutationError.message
      ).toContain("must have the same number of items")
      expect(createArtworkFromTemplateLoader).not.toHaveBeenCalled()
    })

    it("returns error when bucket/key counts don't match", async () => {
      const mismatchedMutation = gql`
        mutation {
          createArtworkFromTemplate(
            input: {
              partnerID: "partner123"
              artworkTemplateID: "template123"
              imageS3Buckets: ["bucket1", "bucket2"]
              imageS3Keys: ["key1.jpg"]
            }
          ) {
            artworkOrError {
              __typename
              ... on CreateArtworkFromTemplateFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      const createArtworkFromTemplateLoader = jest.fn()
      const addImageToArtworkLoader = jest.fn()

      const context = {
        createArtworkFromTemplateLoader,
        addImageToArtworkLoader,
      }

      const result = await runAuthenticatedQuery(mismatchedMutation, context)

      expect(result.createArtworkFromTemplate.artworkOrError.__typename).toBe(
        "CreateArtworkFromTemplateFailure"
      )
      expect(
        result.createArtworkFromTemplate.artworkOrError.mutationError.message
      ).toContain("must have the same number of items")
      expect(createArtworkFromTemplateLoader).not.toHaveBeenCalled()
    })
  })
})
