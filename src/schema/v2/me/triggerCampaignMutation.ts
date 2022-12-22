import { GraphQLEnumType } from "graphql"
import { GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const triggerCampaignMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "TriggerCampaign",
  description: "Triggers a campaign send.",
  inputFields: {
    campaignID: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: "TriggerCampaignID",
          values: {
            // TODO: replace value w/ actual campaignID
            ART_QUIZ: {
              value: "art-quiz",
            },
          },
        })
      ),
    },
  },
  outputFields: {},

  mutateAndGetPayload: async (args, { triggerCampaignLoader }) => {
    if (!triggerCampaignLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return triggerCampaignLoader({ campaign_id: args.campaignID })
  },
})
