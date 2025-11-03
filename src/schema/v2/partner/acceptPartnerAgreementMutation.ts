import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { formatGravityError, ErrorsType } from "lib/gravityErrorHandler"

const PartnerAgreementType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerAgreement",
  fields: () => ({
    // FIXME: Use the InternalIDFields
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (partnerAgreement) => partnerAgreement.id,
    },
    acceptedAt: {
      type: GraphQLString,
      resolve: (partnerAgreement) => partnerAgreement.accepted_at,
    },
    acceptedBy: {
      type: GraphQLString,
      resolve: (partnerAgreement) => partnerAgreement.accepted_by,
    },
  }),
})

const PartnerAgreementOrErrorsUnion = new GraphQLUnionType({
  name: "PartnerAgreementOrErrorsUnion",
  types: [PartnerAgreementType, ErrorsType],
  resolveType: (value) => {
    if (value.errors) {
      return "Errors"
    }
    return "PartnerAgreement"
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
      return await acceptPartnerAgreementLoader({
        partner_agreement_id: partnerAgreementID,
      })
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
