import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "./artist"
import { ArtworkType } from "./artwork"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "./fields/pagination"
import { ShowType } from "./show"

export const partnerShowsMatchConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ShowType,
    name: "partnerShowsMatchConnection",
  }).connectionType,
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    _root,
    { term, entities, mode, ...args },
    { partnerSearchShowsLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchShowsLoader({
      term,
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

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

export const partnerArtworksMatchConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ArtworkType,
    name: "partnerArtworksMatchConnection",
  }).connectionType,
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    _root,
    { term, entities, mode, ...args },
    { partnerSearchArtworksLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchArtworksLoader({
      term,
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

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

export const partnerArtistsMatchConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ArtistType,
    name: "partnerArtistsMatchConnection",
  }).connectionType,
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    _root,
    { term, entities, mode, ...args },
    { partnerSearchArtistsLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchArtistsLoader({
      term,
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

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
