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
  { id: string },
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ShowType,
    name: "partnerShowsSearch",
  }).connectionType,
  args: pageable({
    query: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async ({ id }, { query, ...args }, { partnerSearchShowsLoader }) => {
    if (!partnerSearchShowsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchShowsLoader(id, {
      term: query,
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
  { id: string },
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ArtworkType,
    name: "partnerArtworksSearch",
  }).connectionType,
  args: pageable({
    query: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    { id },
    { query, ...args },
    { partnerSearchArtworksLoader }
  ) => {
    if (!partnerSearchArtworksLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchArtworksLoader(id, {
      term: query,
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
  { id: string },
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ArtistType,
    name: "partnerArtistsSearch",
  }).connectionType,
  args: pageable({
    query: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    { id },
    { query, ...args },
    { partnerSearchArtistsLoader }
  ) => {
    if (!partnerSearchArtistsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerSearchArtistsLoader(id, {
      term: query,
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
