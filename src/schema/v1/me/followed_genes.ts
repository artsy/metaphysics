import Gene from "schema/v1/gene"
import { InternalIDFields } from "schema/v1/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const FollowGeneType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowGene",
  fields: {
    gene: {
      type: Gene.type,
    },
    ...InternalIDFields,
  },
})

const FollowedGenes: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionDefinitions({ nodeType: FollowGeneType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (_root, options, { followedGenesLoader }) => {
    if (!followedGenesLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
    }

    return followedGenesLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
      })
    })
  },
}

export default FollowedGenes
