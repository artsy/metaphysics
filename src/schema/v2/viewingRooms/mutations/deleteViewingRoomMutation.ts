import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const deleteViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "deleteViewingRoom",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  mutateAndGetPayload: async (args, { deleteViewingRoomLoader }) => {
    if (!deleteViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const response = await deleteViewingRoomLoader(args.viewingRoomID)

    return response
  },
})
