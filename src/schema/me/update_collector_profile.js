import { CollectorProfileFields } from "./collector_profile"
import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  GraphQLEnumType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

export const IntentsType = new GraphQLEnumType({
  name: "Intents",
  values: {
    BUY_ART_AND_DESIGN: {
      value: "buy art & design",
    },
    SELL_ART_AND_DESIGN: {
      value: "sell art & design",
    },
    RESEARCH_ART_PRICES: {
      value: "research art prices",
    },
    LEARN_ABOUT_ART: {
      value: "learn about art",
    },
    FIND_ART_EXHIBITS: {
      value: "find out about new exhibitions",
    },
    READ_ART_MARKET_NEWS: {
      value: "read art market news",
    },
  },
})

export default mutationWithClientMutationId({
  name: "UpdateCollectorProfile",
  description: "Updating a collector profile (loyalty applicant status).",
  inputFields: {
    loyalty_applicant: {
      type: GraphQLBoolean,
    },
    professional_buyer: {
      type: GraphQLBoolean,
    },
    self_reported_purchases: {
      type: GraphQLString,
    },
    intents: {
      type: new GraphQLList(IntentsType),
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (
    options,
    request,
    { rootValue: { updateCollectorProfileLoader } }
  ) => {
    if (!updateCollectorProfileLoader) {
      throw new Error(
        "Missing Update Collector Profile Loader. Check your access token."
      )
    }
    return updateCollectorProfileLoader(options)
  },
})
