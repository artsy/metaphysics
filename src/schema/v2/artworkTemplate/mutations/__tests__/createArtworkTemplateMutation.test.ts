import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkTemplateMutation", () => {
  const mutation = gql`
    mutation {
      createArtworkTemplate(
        input: {
          partnerId: "partner123"
          artworkId: "artwork456"
          title: "My Template"
        }
      ) {
        artworkTemplateOrError {
          __typename
          ... on CreateArtworkTemplateSuccess {
            artworkTemplate {
              internalID
              title
              partnerID
            }
          }
          ... on CreateArtworkTemplateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates an artwork template from an existing artwork", async () => {
    const mockArtworkTemplate = {
      id: "template789",
      title: "My Template",
      partner_id: "partner123",
    }

    const createArtworkTemplateLoader = jest
      .fn()
      .mockImplementation((pathParams, bodyData) => {
        expect(pathParams).toEqual({ partnerId: "partner123" })
        expect(bodyData).toEqual({
          artwork_id: "artwork456",
          title: "My Template",
        })
        return Promise.resolve(mockArtworkTemplate)
      })

    const context = { createArtworkTemplateLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkTemplate: {
        artworkTemplateOrError: {
          __typename: "CreateArtworkTemplateSuccess",
          artworkTemplate: {
            internalID: "template789",
            title: "My Template",
            partnerID: "partner123",
          },
        },
      },
    })
  })

  it("handles errors when artwork template creation fails", async () => {
    const createArtworkTemplateLoader = jest.fn().mockImplementation(() => {
      const error: any = new Error("Artwork not found")
      error.statusCode = 404
      error.body = {
        error: "Artwork not found",
        message:
          "The specified artwork does not exist or does not belong to this partner",
      }
      throw error
    })

    const context = { createArtworkTemplateLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkTemplate: {
        artworkTemplateOrError: {
          __typename: "CreateArtworkTemplateFailure",
          mutationError: {
            message: "Artwork not found",
          },
        },
      },
    })
  })
})
