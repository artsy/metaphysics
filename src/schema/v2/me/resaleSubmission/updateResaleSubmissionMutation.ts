import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { majorToMinor } from "lib/moneyHelpers"
import { ResolverContext } from "types/graphql"
import {
  ResaleSubmissionCourierHandoffEnum,
  ResaleSubmissionPackagingEnum,
  ResaleSubmissionPackerEnum,
  ResaleSubmissionType,
} from "./resaleSubmission"

interface Input {
  courierHandoff?: string | null
  id: string
  packaging?: string | null
  packer?: string | null
  priceListed?: string | null
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateResaleSubmissionSuccess",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateResaleSubmissionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateResaleSubmissionResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "UpdateResaleSubmissionFailure"
    }
    return "UpdateResaleSubmissionSuccess"
  },
})

export const updateResaleSubmissionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateResaleSubmission",
  description:
    "Update the asking price and shipping preferences of a resale submission. Omitted or null fields are left unchanged.",
  inputFields: {
    courierHandoff: {
      type: ResaleSubmissionCourierHandoffEnum,
      description: "How the work will get to its buyer.",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the resale submission to update.",
    },
    packaging: {
      type: ResaleSubmissionPackagingEnum,
      description: "How the work will be packed.",
    },
    packer: {
      type: ResaleSubmissionPackerEnum,
      description: "Who will pack the work.",
    },
    priceListed: {
      type: GraphQLString,
      description:
        "The asking price in US dollars, as a plain number like “2500” or “2500.50”, without a currency symbol or separators.",
    },
  },
  outputFields: {
    resaleSubmissionOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated resale submission.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { courierHandoff, id, packaging, packer, priceListed },
    { meUpdateResaleSubmissionLoader }
  ) => {
    if (!meUpdateResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityParams: Record<string, string | number> = {}

    if (priceListed != null) {
      // Resale is US-only for now, so every price is USD.
      const price = majorToMinor(priceListed, "USD")

      if (!price.success) {
        throw new Error(price.error)
      }

      gravityParams.price_listed_minor = price.minor
    }

    if (packaging != null) gravityParams.packaging = packaging
    if (packer != null) gravityParams.packer = packer
    if (courierHandoff != null) gravityParams.courier_handoff = courierHandoff

    try {
      return await meUpdateResaleSubmissionLoader(id, gravityParams)
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
