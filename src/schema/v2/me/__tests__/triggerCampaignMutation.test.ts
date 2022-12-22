import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("triggerCampaignMutation", () => {
  const mutation = gql`
    mutation {
      triggerCampaign(input: { campaignID: ART_QUIZ }) {
        clientMutationId
      }
    }
  `

  const mockTriggerCampaignLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve({ success: true }))

  it("passes correct values to gravity", async () => {
    await runAuthenticatedQuery(mutation, {
      triggerCampaignLoader: mockTriggerCampaignLoader,
    })

    expect(mockTriggerCampaignLoader).toHaveBeenCalledWith({
      campaign_id: "art-quiz",
    })
  })
})
