import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ViewingRoomType } from "schema/v2/viewingRoom"
import { ResolverContext } from "types/graphql"

export const unpublishViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UnpublishViewingRoom",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    viewingRoom: {
      type: new GraphQLNonNull(ViewingRoomType),
      resolve: (result) => result,
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