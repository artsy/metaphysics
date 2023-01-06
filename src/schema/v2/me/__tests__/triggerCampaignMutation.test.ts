import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const CAMPAIGN_IDS = {
  // New campaign IDs can be added by environment variable here
  development: { ART_QUIZ: "485a7169-b3d8-4b0e-81f3-5741db0a1361" },
  staging: { ART_QUIZ: "485a7169-b3d8-4b0e-81f3-5741db0a1361" },
  production: { ART_QUIZ: "bcc384c0-348f-4449-e4c0-0ad9efa7707f" },
}

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

  const mockTriggerCampaignLoader = jest.fn()

  it("passes correct values to gravity", async () => {
    const response = await runAuthenticatedQuery(mutation, {
      triggerCampaignLoader: mockTriggerCampaignLoader,
    })

    expect(mockTriggerCampaignLoader).toHaveBeenCalledWith({
      campaign_id: CAMPAIGN_IDS[config.SYSTEM_ENVIRONMENT].ART_QUIZ,
    })
    expect(response.triggerCampaign.successOrError.success).toBe(true)
    expect(response.triggerCampaign.successOrError.statusCode).toBe(200)
  })
})
