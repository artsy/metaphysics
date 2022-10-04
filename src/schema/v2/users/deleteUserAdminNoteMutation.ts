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
import { UserAdminNoteType } from "../user"

interface Input {
  id: string
  adminNoteId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserAdminNoteSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    adminNote: {
      type: UserAdminNoteType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserAdminNoteFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteUserAdminNoteResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteUserAdminNoteMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteUserAdminNoteMutation",
  description: "delete an admin note for the user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    adminNoteId: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    adminNoteOrError: {
      type: ResponseOrErrorType,
      description: "On success: the admin note deleted.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteUserAdminNoteLoader }) => {
    if (!deleteUserAdminNoteLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteUserAdminNoteLoader?.({
        id: args.id,
        admin_note_id: args.adminNoteId,
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
