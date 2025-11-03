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
import { AgreementType } from "schema/v2/agreement"
import { date } from "schema/v2/fields/date"

const PartnerAgreementType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerAgreement",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique ID for this partner agreement",
      resolve: ({ id }) => id,
    },
    acceptedAt: date(),
    acceptedBy: {
      type: GraphQLString,
      description: "ID of user who accepted this agreement",
      resolve: ({ accepted_by }) => accepted_by,
    },
    agreement: {
      type: new GraphQLNonNull(AgreementType),
      description: "The associated agreement",
      resolve: ({ agreement }) => agreement,
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
