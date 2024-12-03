import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ViewingRoomInputAttributesType } from "./viewingRoomInputAttributes"
import { ViewingRoomOrErrorType } from "./viewingRoomOrError"
import { ARImageInputType } from "./ARImageInput"

export const updateViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateViewingRoom",
  inputFields: {
    attributes: {
      type: new GraphQLNonNull(ViewingRoomInputAttributesType),
    },
    image: {
      type: ARImageInputType,
    },
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    viewingRoomOrErrors: {
      type: ViewingRoomOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateViewingRoomLoader }) => {
    if (!updateViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs = {
        ar_image_id: args.image?.internalID,
        body: args.attributes?.body,
        end_at: args.attributes?.endAt,
        intro_statement: args.attributes?.introStatement,
        pull_quote: args.attributes?.pullQuote,
        start_at: args.attributes?.startAt,
        time_zone: args.attributes?.timeZone,
        title: args.attributes?.title,
      }

      const response = await updateViewingRoomLoader(
        args.viewingRoomID,
        gravityArgs
      )

      return response
    } catch (error) {
      const { body } = error

      return {
        errors: [
          {
            message: body.message ?? body.error,
            code: "invalid",
          },
        ],
      }
    }
  },
})
