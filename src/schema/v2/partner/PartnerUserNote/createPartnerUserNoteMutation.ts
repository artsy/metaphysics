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
  partnerId: string
  userId: string
  body: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerUserNoteSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    partnerUserNote: {
      type: PartnerUserNoteType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerUserNoteFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerUserNoteOrError",
  types: [SuccessType, FailureType],
})

export const CreatePartnerUserNoteMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreatePartnerUserNote",
  description: "Creates a partner's note about a collector.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner.",
    },
    userId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the collector the note is about.",
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
    { partnerId, userId, body },
    { createPartnerUserNoteLoader }
  ) => {
    if (!createPartnerUserNoteLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createPartnerUserNoteLoader({
        partner_id: partnerId,
        user_id: userId,
        body,
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
