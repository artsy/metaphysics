// @ts-check

import Artwork from "schema/artwork/index"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"

export const ArtworkInquiryType = new GraphQLObjectType({
  name: "ArtworkInquiry",
  description: "An inquiry on an Artwork",
  fields: () => ({
    artwork: {
      type: new GraphQLNonNull(Artwork.type),
      resolve: ({ inquireable }) => inquireable,
    },
    id: {
      type: GraphQLID,
    },
    impulse_conversation_id: {
      type: GraphQLString,
    },
  }),
})

export default {
  type: connectionDefinitions({ nodeType: ArtworkInquiryType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { accessToken, inquiryRequestsLoader } }
  ) => {
    if (!accessToken) return null
    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      inquireable_type: "artwork",
      total_count: true,
    }
    return inquiryRequestsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
      })
    })
  },
}
