import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GraphQLFieldConfig } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArticleType } from "./article"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import { PartnerSearchEntity } from "./search/PartnerSearchEntity"

const MODELS = {
  Article: { loader: "articleLoader", type: ArticleType },
}

export const PartnerMatchType = new GraphQLUnionType({
  name: "PartnerMatch",
  types: Object.values(MODELS).map(({ type }) => type),
  resolveType: ({ __typename }) => {
    return MODELS[__typename].type
  },
})

export const PartnerMatchConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({ nodeType: PartnerMatchType }).connectionType,
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
    },
    entities: {
      type: new GraphQLList(new GraphQLNonNull(PartnerSearchEntity)),
      description:
        "ARTIST_SERIES, CITY, COLLECTION, and VIEWING_ROOM are not yet supported",
      defaultValue: ["ARTIST", "ARTWORK", "FAIR", "SHOW"],
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    _root,
    { term, entities, mode, ...args },
    { searchLoader, ...loaders }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await searchLoader({
      term,
      entities,
      mode,
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    const results = await Promise.all(
      body.map(async ({ id, label }) => {
        const loader = loaders[MODELS[label].loader]
        const body = await loader(id)

        return { ...body, __typename: label }
      })
    )

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: results,
      args,
    })
  },
}
