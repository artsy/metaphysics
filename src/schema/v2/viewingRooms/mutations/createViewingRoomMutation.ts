import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ErrorsType } from "lib/gravityErrorHandler"
import { ViewingRoomType } from "schema/v2/viewingRoom"
import { ResolverContext } from "types/graphql"

const ResponseOrErrorType = new GraphQLNonNull(
  new GraphQLUnionType({
    name: "ViewingRoomOrErrorsUnion",
    types: [ViewingRoomType, ErrorsType],
    resolveType: (data) => {
      if (data.id) {
        return ViewingRoomType
      }

      return ErrorsType
    },
  })
)

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
      type: new GraphQLInputObjectType({
        name: "ViewingRoomAttributes",
        fields: {
          body: {
            type: GraphQLString,
          },
          endAt: {
            type: GraphQLString,
            description: "Datetime (in UTC) when Viewing Room closes",
          },
          introStatement: {
            type: GraphQLString,
          },
          pullQuote: {
            type: GraphQLString,
          },
          startAt: {
            type: GraphQLString,
            description: "Datetime (in UTC) when Viewing Room opens",
          },
          timeZone: {
            type: GraphQLString,
            description:
              "Time zone (tz database format, e.g. America/New_York) in which start_at/end_at attributes were input",
          },
          title: {
            type: GraphQLString,
            description: "Title",
          },
        },
      }),
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
      type: new GraphQLInputObjectType({
        name: "ARImageInput",
        fields: {
          internalID: {
            type: new GraphQLNonNull(GraphQLID),
          },
        },
      }),
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
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createViewingRoomLoader }) => {
    if (!createViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs = {
        body: args.body || args.attributes?.body,
        end_at: args.endAt || args.attributes?.endAt,
        image: args.image,
        intro_statement: args.introStatement || args.attributes?.introStatement,
        partner_id: args.partnerId || args.partnerID,
        pull_quote: args.pullQuote || args.attributes?.pullQuote,
        start_at: args.startAt || args.attributes?.startAt,
        time_zone: args.timeZone || args.attributes?.timeZone,
        title: args.title || args.attributes?.title,
      }

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
