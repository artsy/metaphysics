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
import { ContactType } from "schema/v2/Contacts"
import { ResolverContext } from "types/graphql"

interface DeletePartnerContactInputProps {
  contactId: string
  partnerId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerContactSuccess",
  isTypeOf: (data) => !!data._id,
  fields: () => ({
    partnerContact: {
      type: ContactType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerContactFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerContactOrError",
  types: [SuccessType, FailureType],
})

export const DeletePartnerContactMutation = mutationWithClientMutationId<
  DeletePartnerContactInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerContactMutation",
  description: "Deletes a contact for a partner",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    contactId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the contact to delete",
    },
  },
  outputFields: {
    partnerContactOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, contactId },
    { deletePartnerContactLoader }
  ) => {
    if (!deletePartnerContactLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deletePartnerContactLoader({
        partnerId,
        contactId,
      })

      return response
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
