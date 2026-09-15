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
import { PartnerUserNoteType } from "./PartnerUserNoteType"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerUserNoteSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    partnerUserNote: {
      type: PartnerUserNoteType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerUserNoteFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerUserNoteOrError",
  types: [SuccessType, FailureType],
})

export const DeletePartnerUserNoteMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeletePartnerUserNote",
  description: "Deletes a partner's note about a collector.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the note to delete.",
    },
  },
  outputFields: {
    partnerUserNoteOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deletePartnerUserNoteLoader }) => {
    if (!deletePartnerUserNoteLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deletePartnerUserNoteLoader(id)

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
