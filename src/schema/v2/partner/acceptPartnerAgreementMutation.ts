import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  ErrorsType,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { PartnerAgreementType } from "schema/v2/partner/partnerAgreement"
import { deprecate } from "lib/deprecation"

const isFailure = (result: any) => !!result?.errors

const PartnerAgreementOrErrorsUnion = new GraphQLUnionType({
  name: "PartnerAgreementOrErrorsUnion",
  types: [PartnerAgreementType, ErrorsType],
  resolveType: (value) => {
    if (isFailure(value)) {
      return "Errors"
    }
    return "PartnerAgreement"
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AcceptPartnerAgreementSuccess",
  isTypeOf: (data) => !isFailure(data),
  fields: () => ({
    partnerAgreement: {
      type: new GraphQLNonNull(PartnerAgreementType),
      description: "The accepted partner agreement",
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AcceptPartnerAgreementFailure",
  isTypeOf: (data) => isFailure(data),
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (result) => result.errors?.[0],
    },
  }),
})

const AcceptPartnerAgreementOrErrorUnion = new GraphQLUnionType({
  name: "AcceptPartnerAgreementOrError",
  types: [SuccessType, FailureType],
  resolveType: (value) => {
    if (isFailure(value)) {
      return "AcceptPartnerAgreementFailure"
    }
    return "AcceptPartnerAgreementSuccess"
  },
})

export const acceptPartnerAgreementMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AcceptPartnerAgreement",
  description: "Accept a partner agreement",
  inputFields: {
    partnerAgreementID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner agreement.",
    },
  },
  outputFields: {
    partnerAgreementOrErrors: {
      type: new GraphQLNonNull(PartnerAgreementOrErrorsUnion),
      deprecationReason: deprecate({
        inVersion: 2,
        preferUsageOf: "acceptPartnerAgreementOrError",
      }),
      resolve: (result) => result,
    },
    acceptPartnerAgreementOrError: {
      type: new GraphQLNonNull(AcceptPartnerAgreementOrErrorUnion),
      description:
        "On success: the accepted partner agreement. On failure: mutation errors.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerAgreementID },
    { acceptPartnerAgreementLoader }
  ) => {
    if (!acceptPartnerAgreementLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await acceptPartnerAgreementLoader(partnerAgreementID)
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { errors: [{ message: formattedErr.message }] }
      } else {
        throw new Error(error)
      }
    }
  },
})
