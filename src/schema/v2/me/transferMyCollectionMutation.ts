import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const transferMyCollectionMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "TransferMyCollection",
  description: "Transfers My Collection artworks from one user to another.",
  inputFields: {
    emailFrom: {
      type: GraphQLString,
      description: "Email of the source user.",
    },
    emailTo: {
      type: GraphQLString,
      description: "Email of the destination user.",
    },
    idFrom: {
      type: GraphQLString,
      description: "ID of the source user.",
    },
    idTo: {
      type: GraphQLString,
      description: "ID of the destination user.",
    },
  },
  outputFields: {
    count: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ count }) => count,
    },
  },
  mutateAndGetPayload: async (args, { transferMyCollectionLoader }) => {
    if (!transferMyCollectionLoader) {
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    const response = await transferMyCollectionLoader({
      email_from: args.emailFrom,
      email_to: args.emailTo,
      id_from: args.idFrom,
      id_to: args.idTo,
    })

    return { count: response.count }
  },
})
