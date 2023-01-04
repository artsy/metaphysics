import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("triggerCampaignMutation", () => {
  const mutation = gql`
    mutation {
      triggerCampaign(input: { campaignID: ART_QUIZ }) {
        clientMutationId
        successOrError {
          ... on TriggerCampaignMutationSuccess {
            success
            statusCode
          }
        }
      }
    }
  `

  const mockTriggerCampaignLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve({ success: true }))

  it("passes correct values to gravity", async () => {
    const response = await runAuthenticatedQuery(mutation, {
      triggerCampaignLoader: mockTriggerCampaignLoader,
    })

    expect(mockTriggerCampaignLoader).toHaveBeenCalledWith({
      campaign_id: "art-quiz",
    })
    expect(response.triggerCampaign.successOrError.success).toBe(true)
    expect(response.triggerCampaign.successOrError.statusCode).toBe(200)
  })
})
