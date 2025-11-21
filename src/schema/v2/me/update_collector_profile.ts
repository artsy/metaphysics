import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"
import { CollectorProfileType } from "../CollectorProfile/collectorProfile"
import { IntentsType } from "../CollectorProfile/types/IntentsType"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const Success = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectorProfileSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    collectorProfile: {
      type: CollectorProfileType,
      resolve: (result) => result,
    },
  }),
})

const Failure = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectorProfileFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrError = new GraphQLUnionType({
  name: "updateCollectorProfileResponseOrError",
  types: [Success, Failure],
})

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateCollectorProfile",
  description: "Update a collector profile.",
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
    linkedIn: {
      description: "Collector's LinkedIn handle",
      type: GraphQLString,
    },
    instagram: {
      description: "Collector's Instagram handle",
      type: GraphQLString,
    },
    intents: { type: new GraphQLList(IntentsType) },
    loyaltyApplicant: { type: GraphQLBoolean },
    professionalBuyer: { type: GraphQLBoolean },
    promptedForUpdate: {
      type: GraphQLBoolean,
      description:
        "Since we don't want to ask a collector to update their profile too often, set this to record they've been prompted",
    },
    selfReportedPurchases: {
      description: "Free-form text of purchases the collector has indicated.",
      type: GraphQLString,
    },
  },
  outputFields: {
    collectorProfileOrError: {
      type: ResponseOrError,
      description: "On success: the updated collector profile.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (args, { meUpdateCollectorProfileLoader }) => {
    // snake_case keys for Gravity (keys are the same otherwise)
    const options = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    if (!meUpdateCollectorProfileLoader) {
      throw new Error(
        "Missing Update Collector Profile Loader. Check your access token."
      )
    }

    try {
      return meUpdateCollectorProfileLoader(options)
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
