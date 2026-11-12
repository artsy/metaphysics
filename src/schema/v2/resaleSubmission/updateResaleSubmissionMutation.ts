import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResaleSubmissionUpdate } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import { ResolverContext } from "types/graphql"
import {
  ResaleSubmissionCourierHandoffEnum,
  ResaleSubmissionPackagingEnum,
  ResaleSubmissionPackerEnum,
  ResaleSubmissionType,
} from "./resaleSubmission"
import { toMutationError } from "./mutationError"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateResaleSubmissionSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (submission) => submission,
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
})

interface InputProps {
  id: string
  priceListedMinor?: number | null
  packaging?: string | null
  packer?: string | null
  courierHandoff?: string | null
}

export const updateResaleSubmissionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "UpdateResaleSubmission",
  description:
    "Update the asking price and shipping preferences of a resale submission. Omitted or null fields stay unchanged.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The resale submission's internalID",
    },
    priceListedMinor: {
      type: GraphQLLong,
      description:
        "The collector's asking price in minor units (cents), in the submission's currency",
    },
    packaging: { type: ResaleSubmissionPackagingEnum },
    packer: { type: ResaleSubmissionPackerEnum },
    courierHandoff: { type: ResaleSubmissionCourierHandoffEnum },
  },
  outputFields: {
    resaleSubmissionOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, priceListedMinor, packaging, packer, courierHandoff },
    { updateResaleSubmissionLoader }
  ) => {
    if (!updateResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const update: ResaleSubmissionUpdate = {}
    if (priceListedMinor != null) update.price_listed_minor = priceListedMinor
    if (packaging != null) update.packaging = packaging
    if (packer != null) update.packer = packer
    if (courierHandoff != null) update.courier_handoff = courierHandoff

    try {
      return await updateResaleSubmissionLoader(id, update)
    } catch (error) {
      return toMutationError(error)
    }
  },
})
