import Artwork from "schema/v2/artwork/index"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"

export const ArtworkInquiryType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkInquiry",
  description: "An inquiry on an Artwork",
  fields: () => ({
    ...InternalIDFields,
    artwork: {
      type: new GraphQLNonNull(Artwork.type),
      resolve: ({ inquireable }) => inquireable,
    },
    impulseConversationID: {
      type: GraphQLString,
      resolve: ({ impulse_conversation_id }) => impulse_conversation_id,
    },
  }),
})

const ArtworkInquiries: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionDefinitions({ nodeType: ArtworkInquiryType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (_root, options, { inquiryRequestsLoader, userID }) => {
    if (!inquiryRequestsLoader) return null
    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      inquireable_type: "artwork",
      total_count: true,
      ...(userID && { user_id: userID }),
    }
    return inquiryRequestsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
      })
    })
  },
}

export default ArtworkInquiries
