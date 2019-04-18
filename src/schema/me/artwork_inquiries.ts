import Artwork from "schema/artwork/index"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GravityIDFields } from "schema/object_identification"

export const ArtworkInquiryType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkInquiry",
  description: "An inquiry on an Artwork",
  fields: () => ({
    ...GravityIDFields,
    artwork: {
      type: new GraphQLNonNull(Artwork.type),
      resolve: ({ inquireable }) => inquireable,
    },
    impulse_conversation_id: {
      type: GraphQLString,
    },
  }),
})

const ArtworkInquiries: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionDefinitions({ nodeType: ArtworkInquiryType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (_root, options, { inquiryRequestsLoader }) => {
    if (!inquiryRequestsLoader) return null
    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      inquireable_type: "artwork",
      total_count: true,
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
