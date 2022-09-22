import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArticleType } from "./article"
import { createPageCursors } from "./fields/pagination"
import { PartnerSearchEntity } from "./search/PartnerSearchEntity"
import { ShowsConnection } from "./show"

const MODELS = {
  Show: { loader: "articleLoader", type: ArticleType },
}

export const PartnerMatchType = new GraphQLUnionType({
  name: "PartnerMatch",
  types: Object.values(MODELS).map(({ type }) => type),
  resolveType: ({ __typename }) => {
    console.log("Resolving type", __typename)
    return MODELS[__typename].type
  },
})

export const PartnerMatchConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ShowsConnection.connectionType, // connectionWithCursorInfo({ nodeType: PartnerMatchType }).connectionType,
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
    },
    entities: {
      type: new GraphQLList(new GraphQLNonNull(PartnerSearchEntity)),
      description: "Entities to retrieve from search",
      defaultValue: ["ARTIST", "ARTWORK", "SHOW"],
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    _root,
    { term, entities, mode, ...args },
    { partnerSearchLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchLoader({
      term,
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    console.log("Got body:", body)

    return {
      totalCount,
      pageCursors: createPageCursors({ ...args, page, size }, totalCount),
      ...connectionFromArraySlice(body, args, {
        arrayLength: totalCount,
        sliceStart: offset,
      }),
    }
  },
}
