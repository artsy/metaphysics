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

export const addUserRoleMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "addUserRoleMutation",
  description: "Add a role to to User",
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
  mutateAndGetPayload: async (args, { addUserRole }) => {
    if (!addUserRole) {
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    try {
      return await addUserRole?.({ id: args.id, role_type: args.role })
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
