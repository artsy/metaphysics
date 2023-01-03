import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "TriggerCampaignMutationSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
    statusCode: {
      type: GraphQLInt,
      resolve: (result) => result.statusCode,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: () => "Campaign successfully triggered",
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "TriggerCampaignMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
    statusCode: {
      type: GraphQLInt,
      resolve: (result) => result.statusCode,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: () => "Campaign failed to trigger",
    },
  }),
})

const SuccessOrErrorType = new GraphQLUnionType({
  name: "TriggerCampaignMutationSuccessOrError",
  types: [SuccessType, ErrorType],
})

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
  outputFields: {
    successOrError: {
      type: SuccessOrErrorType,
      resolve: (result) => result,
    },
  },

  mutateAndGetPayload: async (args, { triggerCampaignLoader }) => {
    if (!triggerCampaignLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await triggerCampaignLoader({ campaign_id: args.campaignID })

      return {
        success: true,
      }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
