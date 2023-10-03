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
import { ResolverContext } from "types/graphql"
import { AdvisoryOpportunityType } from "./advisoryOpportunity"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "createAdvisoryOpportunitySuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    advisoryOpportunity: {
      type: new GraphQLNonNull(AdvisoryOpportunityType),
      resolve: (advisoryOpportunity) => advisoryOpportunity,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "createAdvisoryOpportunityFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "createAdvisoryOpportunityResponseOrError",
  types: [SuccessType, FailureType],
})

export const createAdvisoryOpportunityMutation = mutationWithClientMutationId<
  {
    message: string
    searchCriteriaID: string
    phoneCountryCode?: string
    phoneNumber?: string
  },
  any | null,
  ResolverContext
>({
  name: "createAdvisoryOpportunityMutation",
  description: "Create an advisory opportunity",
  inputFields: {
    searchCriteriaID: { type: new GraphQLNonNull(GraphQLString) },
    message: { type: GraphQLString },
    phoneCountryCode: { type: GraphQLString },
    phoneNumber: { type: GraphQLString },
  },
  outputFields: {
    advisoryOpportunityOrError: {
      type: ResponseOrErrorType,
      description: "On success: the advisory opportunity",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      message,
      searchCriteriaID: search_criteria_id,
      phoneCountryCode: phone_country_code,
      phoneNumber: phone_number,
    },
    { createAdvisoryOpportunityLoader, userID }
  ) => {
    if (!createAdvisoryOpportunityLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    if (!userID) {
      throw new Error(
        "You need to pass a X-User-Id header to perform this action"
      )
    }

    try {
      return await createAdvisoryOpportunityLoader?.({
        message,
        search_criteria_id,
        phone_country_code,
        phone_number,
      })
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
