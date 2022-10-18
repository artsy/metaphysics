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
import { CollectorProfileType } from "../collectorProfile"
import { IntentsType } from "../types/IntentsType"
import { omit } from "lodash"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectorProfileWithIDSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    collectorProfile: {
      type: CollectorProfileType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectorProfileWithIDFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCollectorProfileWithIDResponseOrError",
  types: [SuccessType, FailureType],
})

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateCollectorProfileWithID",
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
    companyName: { type: GraphQLString },
    companyWebsite: { type: GraphQLString },
    confirmedBuyer: { type: GraphQLBoolean },
    id: {
      description: "The internal ID of the collector profile to update",
      type: GraphQLString,
    },
    institutionalAffiliations: { type: GraphQLString },
    intents: { type: new GraphQLList(IntentsType) },
    loyaltyApplicant: { type: GraphQLBoolean },
    professionalBuyer: { type: GraphQLBoolean },
    selfReportedPurchases: {
      description: "Free-form text of purchases the collector has indicated.",
      type: GraphQLString,
    },
  },
  outputFields: {
    collectorProfileOrError: {
      type: ResponseOrErrorType,
      description: "On success: the collector profile",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateCollectorProfileLoader }) => {
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

    try {
      const result = await updateCollectorProfileLoader(
        args.id,
        omit(options, "id")
      )
      return result
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
