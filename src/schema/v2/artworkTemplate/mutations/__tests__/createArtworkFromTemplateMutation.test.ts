import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkFromTemplateMutation", () => {
  const mutation = gql`
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

    const context = { createArtworkFromTemplateLoader }

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

    const context = { createArtworkFromTemplateLoader }

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

    const context = { createArtworkFromTemplateLoader }

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
})
