import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { UserAdminNoteType } from "../user"

interface Input {
  id: string
  body: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

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
    userAdminNote: {
      type: new GraphQLNonNull(UserAdminNoteType),
      description: "On success: an identity verification with overrides",
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
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
