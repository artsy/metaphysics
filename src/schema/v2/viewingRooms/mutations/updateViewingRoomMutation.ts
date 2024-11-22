import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ViewingRoomInputAttributesType } from "./viewingRoomInputAttributes"
import { ViewingRoomOrErrorType } from "./viewingRoomOrError"
import { ARImageInputType } from "./ARImageInput"
import { identity, pickBy } from "lodash"

export const updateViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "updateViewingRoom",
  inputFields: {
    attributes: {
      type: ViewingRoomInputAttributesType,
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
      // remove undefined or null values from attributes
      const gravityArgs = pickBy(
        {
          ar_image_id: args.image?.internalID,
          body: args.attributes?.body,
          end_at: args.attributes?.endAt,
          intro_statement: args.attributes?.introStatement,
          pull_quote: args.attributes?.pullQuote,
          start_at: args.attributes?.startAt,
          time_zone: args.attributes?.timeZone,
          title: args.attributes?.title,
        },
        identity
      )

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
