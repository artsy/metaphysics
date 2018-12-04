import Gene from "schema/gene"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType } from "graphql"

export const FollowGeneType = new GraphQLObjectType({
  name: "FollowGene",
  fields: {
    gene: {
      type: Gene.type,
    },
    ...IDFields,
  },
})

export default {
  type: connectionDefinitions({ nodeType: FollowGeneType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (root, options, request, { rootValue: { followedGenesLoader } }) => {
    if (!followedGenesLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
    }

    return followedGenesLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
      })
    })
  },
}
