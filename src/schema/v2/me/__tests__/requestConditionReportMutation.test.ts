import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const describeIfEnabled = config.USE_UNSTITCHED_REQUEST_CONDITION_REPORT
  ? describe
  : describe.skip

describeIfEnabled("requestConditionReportMutation", () => {
  const mockRequestConditionReportLoader = jest.fn()

  const context = {
    requestConditionReportLoader: mockRequestConditionReportLoader,
  }

  beforeEach(() => {
    mockRequestConditionReportLoader.mockResolvedValue({
      id: "condition-report-123",
      sale_artwork_id: "sale-artwork-456",
      user_id: "user-789",
    })
  })

  afterEach(() => {
    mockRequestConditionReportLoader.mockReset()
  })

  it("requests a condition report for a sale artwork", async () => {
    const mutation = gql`
      mutation {
        requestConditionReport(input: { saleArtworkID: "sale-artwork-456" }) {
          conditionReportRequest {
            internalID
            saleArtworkID
            userID
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockRequestConditionReportLoader).toHaveBeenCalledWith({
      sale_artwork_id: "sale-artwork-456",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "requestConditionReport": {
          "conditionReportRequest": {
            "internalID": "condition-report-123",
            "saleArtworkID": "sale-artwork-456",
            "userID": "user-789",
          },
        },
      }
    `)
  })

  it("throws an error when the request fails", async () => {
    mockRequestConditionReportLoader.mockRejectedValue(
      new Error("Sale artwork not found")
    )

    const mutation = gql`
      mutation {
        requestConditionReport(input: { saleArtworkID: "sale-artwork-456" }) {
          conditionReportRequest {
            internalID
          }
        }
      }
    `

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Sale artwork not found"
    )
  })

  it("throws an error if user is not authenticated", () => {
    const unauthenticatedContext = {
      requestConditionReportLoader: undefined,
    }

    const mutation = gql`
      mutation {
        requestConditionReport(input: { saleArtworkID: "sale-artwork-456" }) {
          conditionReportRequest {
            internalID
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
