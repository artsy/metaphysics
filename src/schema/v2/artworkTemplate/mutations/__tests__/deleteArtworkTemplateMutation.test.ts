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
  }

  beforeEach(() => {
    mockDeletePartnerArtworkTemplateLoader.mockResolvedValue(
      Promise.resolve(artworkTemplateData)
    )
  })

  afterEach(() => {
    mockDeletePartnerArtworkTemplateLoader.mockReset()
  })

  const mutation = gql`
    mutation {
      deleteArtworkTemplate(
        input: {
          partnerID: "partner-id"
          artworkTemplateID: "artwork-template-id"
        }
      ) {
        __typename
      }
    }
  `

  it("correctly calls the deletePartnerArtworkTemplateLoader", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockDeletePartnerArtworkTemplateLoader).toHaveBeenCalledWith({
      partnerId: "partner-id",
      templateId: "artwork-template-id",
    })
  })
})
