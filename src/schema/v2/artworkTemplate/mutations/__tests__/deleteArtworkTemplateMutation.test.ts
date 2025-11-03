import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteArtworkTemplateMutation", () => {
  const mockDeletePartnerArtworkTemplateLoader = jest.fn()

  const context = {
    deletePartnerArtworkTemplateLoader: mockDeletePartnerArtworkTemplateLoader,
  }

  const artworkTemplateData = {
    id: "artwork-template-id",
    partner_id: "partner-id",
    title: "Test Template",
  }

  afterEach(() => {
    mockDeletePartnerArtworkTemplateLoader.mockReset()
  })

  describe("on success", () => {
    const mutation = gql`
      mutation {
        deleteArtworkTemplate(
          input: {
            partnerID: "partner-id"
            artworkTemplateID: "artwork-template-id"
          }
        ) {
          artworkTemplateOrError {
            __typename
            ... on DeleteArtworkTemplateSuccess {
              artworkTemplate {
                internalID
                title
              }
            }
            ... on DeleteArtworkTemplateFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    beforeEach(() => {
      mockDeletePartnerArtworkTemplateLoader.mockResolvedValue(
        Promise.resolve(artworkTemplateData)
      )
    })

    it("correctly calls the deletePartnerArtworkTemplateLoader", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(mockDeletePartnerArtworkTemplateLoader).toHaveBeenCalledWith({
        partnerId: "partner-id",
        templateId: "artwork-template-id",
      })
    })

    it("returns the deleted artwork template", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toEqual({
        deleteArtworkTemplate: {
          artworkTemplateOrError: {
            __typename: "DeleteArtworkTemplateSuccess",
            artworkTemplate: {
              internalID: "artwork-template-id",
              title: "Test Template",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const mutation = gql`
      mutation {
        deleteArtworkTemplate(
          input: { partnerID: "partner-id", artworkTemplateID: "invalid-id" }
        ) {
          artworkTemplateOrError {
            __typename
            ... on DeleteArtworkTemplateSuccess {
              artworkTemplate {
                internalID
              }
            }
            ... on DeleteArtworkTemplateFailure {
              mutationError {
                message
                statusCode
              }
            }
          }
        }
      }
    `

    beforeEach(() => {
      mockDeletePartnerArtworkTemplateLoader.mockRejectedValue({
        statusCode: 404,
        body: {
          error: "Artwork template not found",
        },
      })
    })

    it("returns a mutation error", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toEqual({
        deleteArtworkTemplate: {
          artworkTemplateOrError: {
            __typename: "DeleteArtworkTemplateFailure",
            mutationError: {
              message: "Artwork template not found",
              statusCode: 404,
            },
          },
        },
      })
    })
  })
})
