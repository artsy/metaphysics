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
  body: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "createUserAdminNoteSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    adminNote: {
      type: UserAdminNoteType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "createUserAdminNoteFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "createUserAdminNoteResponseOrError",
  types: [SuccessType, FailureType],
})

export const createUserAdminNoteMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "createUserAdminNoteMutation",
  description: "Create a admin note for the user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    adminNoteOrError: {
      type: ResponseOrErrorType,
      description: "On success: the admin note created.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createUserAdminNoteLoader }) => {
    if (!createUserAdminNoteLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await createUserAdminNoteLoader?.(args.id, { body: args.body })
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
