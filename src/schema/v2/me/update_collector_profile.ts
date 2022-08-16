import { CollectorProfileFields } from "./collector_profile"
import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  GraphQLEnumType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"

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

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateCollectorProfile",
  description: "Updating a collector profile (loyalty applicant status).",
  inputFields: {
    affiliatedAuctionHouseIds: {
      description: "List of affiliated auction house ids, referencing Galaxy.",
      type: new GraphQLList(GraphQLString),
    },
    affiliatedFairIds: {
      description: "List of affiliated fair ids, referencing Galaxy.",
      type: new GraphQLList(GraphQLString),
    },
    affiliatedGalleryIds: {
      description: "List of affiliated gallery ids, referencing Galaxy.",
      type: new GraphQLList(GraphQLString),
    },
    institutionalAffiliations: { type: GraphQLString },
    companyName: { type: GraphQLString },
    companyWebsite: { type: GraphQLString },
    intents: { type: new GraphQLList(IntentsType) },
    loyaltyApplicant: { type: GraphQLBoolean },
    professionalBuyer: { type: GraphQLBoolean },
    selfReportedPurchases: {
      description: "Free-form text of purchases the collector has indicated.",
      type: GraphQLString,
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (args, { updateCollectorProfileLoader }) => {
    // snake_case keys for Gravity (keys are the same otherwise)
    const options = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    if (!updateCollectorProfileLoader) {
      throw new Error(
        "Missing Update Collector Profile Loader. Check your access token."
      )
    }

    return updateCollectorProfileLoader(options)
  },
})
