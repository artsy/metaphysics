import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    createMailchimpCampaign(input: {
      mailchimpAccountId: "mc-account-1"
      subjectLine: "New Artworks from Acme Gallery"
      listId: "list-1"
      artworkIds: ["artwork-1", "artwork-2"]
    }) {
      mailchimpCampaignOrError {
        __typename
        ... on CreateMailchimpCampaignSuccess {
          mailchimpCampaign {
            internalID
            subjectLine
            status
          }
        }
        ... on CreateMailchimpCampaignFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

const mockGravityResponse = {
  id: "campaign-1",
  _id: "campaign-1",
  subject_line: "New Artworks from Acme Gallery",
  status: "draft",
  partner_id: "partner-1",
  list_id: "list-1",
}

describe("createMailchimpCampaign", () => {
  describe("with artworkIds", () => {
    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        createMailchimpCampaignLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.createMailchimpCampaignLoader as jest.Mock
      ).toHaveBeenCalledWith({
        mailchimp_account_id: "mc-account-1",
        subject_line: "New Artworks from Acme Gallery",
        list_id: "list-1",
        artwork_ids: ["artwork-1", "artwork-2"],
        partner_show_id: undefined,
        preview_text: undefined,
      })
    })

    it("returns the created campaign on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "createMailchimpCampaign": {
            "mailchimpCampaignOrError": {
              "__typename": "CreateMailchimpCampaignSuccess",
              "mailchimpCampaign": {
                "internalID": "campaign-1",
                "status": "DRAFT",
                "subjectLine": "New Artworks from Acme Gallery",
              },
            },
          },
        }
      `)
    })
  })

  describe("with partnerShowId", () => {
    const mutationWithShow = `
      mutation {
        createMailchimpCampaign(input: {
          mailchimpAccountId: "mc-account-1"
          subjectLine: "Gallery Show"
          listId: "list-1"
          partnerShowId: "show-1"
        }) {
          mailchimpCampaignOrError {
            __typename
            ... on CreateMailchimpCampaignSuccess {
              mailchimpCampaign {
                internalID
                subjectLine
                status
              }
            }
          }
        }
      }
    `

    it("passes correct args to Gravity", async () => {
      const context: Partial<ResolverContext> = {
        createMailchimpCampaignLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }

      await runAuthenticatedQuery(mutationWithShow, context)

      expect(
        context.createMailchimpCampaignLoader as jest.Mock
      ).toHaveBeenCalledWith({
        mailchimp_account_id: "mc-account-1",
        subject_line: "Gallery Show",
        list_id: "list-1",
        artwork_ids: undefined,
        partner_show_id: "show-1",
        preview_text: undefined,
      })
    })
  })

  describe("mutually exclusive fields", () => {
    const mutationWithBoth = `
      mutation {
        createMailchimpCampaign(input: {
          mailchimpAccountId: "mc-account-1"
          subjectLine: "Test"
          listId: "list-1"
          artworkIds: ["artwork-1"]
          partnerShowId: "show-1"
        }) {
          mailchimpCampaignOrError {
            __typename
          }
        }
      }
    `

    it("throws when both artworkIds and partnerShowId are provided", async () => {
      const context: Partial<ResolverContext> = {
        createMailchimpCampaignLoader: jest.fn(),
      }

      await expect(
        runAuthenticatedQuery(mutationWithBoth, context)
      ).rejects.toThrow(
        'The "artworkIds" and "partnerShowId" arguments are mutually exclusive.'
      )
    })
  })

  it("returns failure when Gravity returns an error", async () => {
    const gravityResponseBody = {
      detail: "Account is not active",
      message: "Account is not active.",
      type: "param_error",
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context: Partial<ResolverContext> = {
      createMailchimpCampaignLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "createMailchimpCampaign": {
          "mailchimpCampaignOrError": {
            "__typename": "CreateMailchimpCampaignFailure",
            "mutationError": {
              "message": "Account is not active.",
            },
          },
        },
      }
    `)
  })
})
