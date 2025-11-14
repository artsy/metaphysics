import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("acceptPartnerAgreementMutation", () => {
  const mockAcceptPartnerAgreementLoader = jest.fn()

  const context = {
    acceptPartnerAgreementLoader: mockAcceptPartnerAgreementLoader,
  }

  beforeEach(() => {
    mockAcceptPartnerAgreementLoader.mockResolvedValue({
      id: "partner-agreement-123",
      accepted_at: "2025-01-01T00:00:00Z",
      accepted_by: "user-456",
      agreement: {
        id: "agreement-789",
        name: "Partner Agreement 2025",
        content: "# Agreement Content",
        description: "Test agreement",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deactivated_at: null,
      },
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
              agreement {
                id
                name
                description
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockAcceptPartnerAgreementLoader).toHaveBeenCalledWith(
      "partner-agreement-123"
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "acceptPartnerAgreement": {
          "partnerAgreementOrErrors": {
            "acceptedAt": "2025-01-01T00:00:00Z",
            "acceptedBy": "user-456",
            "agreement": {
              "description": "Test agreement",
              "id": "agreement-789",
              "name": "Partner Agreement 2025",
            },
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

    expect(mockAcceptPartnerAgreementLoader).toHaveBeenCalledWith("invalid-id")

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
