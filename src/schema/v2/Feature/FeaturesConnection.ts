import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { FeatureConnection } from "./Feature"

import { GraphQLEnumType } from "graphql"

const FeatureSortsType = new GraphQLEnumType({
  name: "FeatureSorts",
  values: {
    CREATED_AT_ASC: {
      value: "created_at",
    },
    CREATED_AT_DESC: {
      value: "-created_at",
    },
    NAME_ASC: {
      value: "name",
    },
    NAME_DESC: {
      value: "-name",
    },
  },
})

export const FeaturesConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: FeatureConnection.connectionType,
  args: pageable({
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
    sort: {
      type: FeatureSortsType,
    },
  }),
  resolve: async (_root, args, { featuresLoader, matchFeaturesLoader }) => {
    if (!matchFeaturesLoader || !featuresLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { term } = args
    const { page, size, offset, sort } = convertConnectionArgsToGravityArgs(
      args
    )

    if (term && sort)
      throw new Error("`sort` and `term` are mutually exclusive parameters.")

    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
      sort?: string
    } = {
      page,
      size,
      total_count: true,
    }

    if (term) gravityArgs.term = term
    if (sort) gravityArgs.sort = sort

    const loader = term ? matchFeaturesLoader : featuresLoader

    const { body, headers } = await loader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
