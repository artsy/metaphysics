import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { identity, pickBy } from "lodash"
import { ResolverContext } from "types/graphql"
import { ViewingRoomInputAttributesType } from "./viewingRoomInputAttributes"
import { ViewingRoomOrErrorType } from "./viewingRoomOrError"
import { ARImageInputType } from "./ARImageInput"

export const createViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "createViewingRoom",
  inputFields: {
    // If you scroll futher down, you'll notice that some attributes from attributes are duplicated in the inputFields
    // This is because Gravity has such duplication https://github.com/artsy/gravity/blob/main/app/graphql/mutations/create_viewing_room.rb#L12
    // We can get rid of it once we finish with the migration. For now I want to keep such changes to a minimum
    attributes: {
      type: ViewingRoomInputAttributesType,
    },
    body: {
      type: GraphQLString,
      description: "Main text",
    },
    endAt: {
      type: GraphQLString,
      description: "End datetime",
    },
    image: {
      type: ARImageInputType,
    },
    introStatement: {
      type: GraphQLString,
      description: "Introduction",
    },
    partnerId: {
      type: GraphQLString,
      description: "Partner Id",
    },
    partnerID: {
      type: GraphQLString,
    },
    pullQuote: {
      type: GraphQLString,
      description: "Pullquote",
    },
    startAt: {
      type: GraphQLString,
      description: "Start datetime",
    },
    timeZone: {
      type: GraphQLString,
      description: "Timezone",
    },
    title: {
      type: GraphQLString,
      description: "Title",
    },
  },
  outputFields: {
    viewingRoomOrErrors: {
      type: ViewingRoomOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createViewingRoomLoader }) => {
    if (!createViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs = pickBy(
        {
          body: args.body || args.attributes?.body,
          end_at: args.endAt || args.attributes?.endAt,
          ar_image_id: args.image?.internalID,
          intro_statement:
            args.introStatement || args.attributes?.introStatement,
          partner_id: args.partnerId || args.partnerID,
          pull_quote: args.pullQuote || args.attributes?.pullQuote,
          start_at: args.startAt || args.attributes?.startAt,
          time_zone: args.timeZone || args.attributes?.timeZone,
          title: args.title || args.attributes?.title,
        },
        identity
      )

      const response = await createViewingRoomLoader(gravityArgs)

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
