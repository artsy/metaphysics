import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const unpublishViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "unpublishViewingRoom",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  mutateAndGetPayload: async (args, { updateViewingRoomLoader }) => {
    if (!updateViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const response = await updateViewingRoomLoader(args.viewingRoomID, {
      published: false,
    })

    return response
  },
})
