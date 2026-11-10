import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import currencyCodes from "lib/currency_codes.json"
import { ResaleSubmissionUpdate } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import { MoneyInput } from "schema/v2/fields/money"
import { ResolverContext } from "types/graphql"
import {
  ResaleSubmissionCourierHandoffEnum,
  ResaleSubmissionPackagingEnum,
  ResaleSubmissionPackerEnum,
  ResaleSubmissionType,
} from "./resaleSubmission"
import { mutationError } from "./mutationError"

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

const SUBMISSION_CURRENCY = "USD"

interface InputProps {
  id: string
  priceListed?: { amount: number; currencyCode: string }
  packaging?: string
  packer?: string
  courierHandoff?: string
}

export const updateResaleSubmissionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "UpdateResaleSubmission",
  description:
    "Update the asking price and shipping preferences of a resale submission. Omitted fields stay unchanged.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The resale submission's internalID",
    },
    priceListed: {
      type: MoneyInput,
      description: "The collector's asking price, in major units (dollars)",
    },
    packaging: { type: ResaleSubmissionPackagingEnum },
    packer: { type: ResaleSubmissionPackerEnum },
    courierHandoff: { type: ResaleSubmissionCourierHandoffEnum },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, priceListed, packaging, packer, courierHandoff },
    { updateResaleSubmissionLoader }
  ) => {
    if (!updateResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const update: ResaleSubmissionUpdate = {}

    if (priceListed) {
      if (priceListed.currencyCode.toUpperCase() !== SUBMISSION_CURRENCY) {
        return mutationError(
          `priceListed currency must be ${SUBMISSION_CURRENCY}`
        )
      }
      const factor =
        currencyCodes[SUBMISSION_CURRENCY.toLowerCase()].subunit_to_unit
      update.price_listed_minor = Math.round(priceListed.amount * factor)
    }
    if (packaging) update.packaging = packaging
    if (packer) update.packer = packer
    if (courierHandoff) update.courier_handoff = courierHandoff

    try {
      return await updateResaleSubmissionLoader(id, update)
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      }
      throw new Error(error)
    }
  },
})
