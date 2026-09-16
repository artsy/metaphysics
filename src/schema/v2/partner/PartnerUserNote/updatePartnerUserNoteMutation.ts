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
  body: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerUserNoteSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    partnerUserNote: {
      type: PartnerUserNoteType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerUserNoteFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerUserNoteOrError",
  types: [SuccessType, FailureType],
})

export const UpdatePartnerUserNoteMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdatePartnerUserNote",
  description: "Updates a partner's note about a collector.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the note to update.",
    },
    body: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Note text.",
    },
  },
  outputFields: {
    partnerUserNoteOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, body },
    { updatePartnerUserNoteLoader }
  ) => {
    if (!updatePartnerUserNoteLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updatePartnerUserNoteLoader(id, { body })

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
