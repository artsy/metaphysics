import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const describeIfFeatureFlagEnabled = config.USE_UNSTITCHED_ACCEPT_PARTNER_AGREEMENT
  ? describe
  : describe.skip

describeIfFeatureFlagEnabled("acceptPartnerAgreementMutation", () => {
  const mockAcceptPartnerAgreementLoader = jest.fn()

  const context = {
    acceptPartnerAgreementLoader: mockAcceptPartnerAgreementLoader,
  }

  beforeEach(() => {
    mockAcceptPartnerAgreementLoader.mockResolvedValue({
      id: "partner-agreement-123",
      accepted_at: "2025-01-01T00:00:00Z",
      accepted_by: "user-456",
    })
  })

  afterEach(() => {
    mockAcceptPartnerAgreementLoader.mockReset()
  })

  it("accepts a partner agreement", async () => {
    const mutation = gql`
      mutation {
        acceptPartnerAgreement(
          input: { partnerAgreementID: "partner-agreement-123" }
        ) {
          partnerAgreementOrErrors {
            ... on PartnerAgreement {
              acceptedAt
              acceptedBy
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockAcceptPartnerAgreementLoader).toHaveBeenCalledWith({
      partner_agreement_id: "partner-agreement-123",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "acceptPartnerAgreement": {
          "partnerAgreementOrErrors": {
            "acceptedAt": "2025-01-01T00:00:00Z",
            "acceptedBy": "user-456",
          },
        },
      }
    `)
  })

  it("returns an error when the partner agreement is not found", async () => {
    mockAcceptPartnerAgreementLoader.mockRejectedValue({
      statusCode: 404,
      body: {
        error: "Partner agreement not found",
      },
    })

    const mutation = gql`
      mutation {
        acceptPartnerAgreement(input: { partnerAgreementID: "invalid-id" }) {
          partnerAgreementOrErrors {
            ... on PartnerAgreement {
              acceptedAt
            }
            ... on Errors {
              errors {
                message
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockAcceptPartnerAgreementLoader).toHaveBeenCalledWith({
      partner_agreement_id: "invalid-id",
    })

    expect(
      result.acceptPartnerAgreement.partnerAgreementOrErrors
    ).toHaveProperty("errors")
    expect(
      result.acceptPartnerAgreement.partnerAgreementOrErrors.errors[0]
    ).toHaveProperty("message")
  })

  it("throws an error if user is not authenticated", () => {
    const unauthenticatedContext = {
      acceptPartnerAgreementLoader: undefined,
    }

    const mutation = gql`
      mutation {
        acceptPartnerAgreement(
          input: { partnerAgreementID: "partner-agreement-123" }
        ) {
          partnerAgreementOrErrors {
            ... on PartnerAgreement {
              acceptedAt
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(mutation, unauthenticatedContext).catch(
      (error) => {
        expect(error.message).toEqual(
          "You need to be signed in to perform this action"
        )
      }
    )
  })
})
