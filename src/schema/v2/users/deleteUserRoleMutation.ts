import { GraphQLList, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

interface Input {
  id: string
  role: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const deleteUserRoleMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteUserRoleMutation",
  description: "Remove a role from the user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    role: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    roles: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: "On success: the updated user roles",
      resolve: (result) => result.roles,
    },
  },
  mutateAndGetPayload: async (args, { deleteUserRole }) => {
    if (!deleteUserRole) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteUserRole?.({ id: args.id, role_type: args.role })
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
