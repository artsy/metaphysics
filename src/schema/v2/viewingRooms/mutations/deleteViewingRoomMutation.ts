import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ViewingRoomType } from "schema/v2/viewingRoom"

export const deleteViewingRoomMutation = mutationWithClientMutationId({
  name: "DeleteViewingRoom",
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
  mutateAndGetPayload: async (args, { deleteViewingRoomLoader }) => {
    if (!deleteViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const response = await deleteViewingRoomLoader(args.viewingRoomID)

    return response
  },
})
