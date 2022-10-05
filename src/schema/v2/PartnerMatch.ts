import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { GraphQLFieldConfig } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { artistConnection } from "./artist"
import { artworkConnection } from "./artwork"
import { paginationResolver } from "./fields/pagination"
import { ShowsConnection } from "./show"

export const partnerShowsMatchConnection: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: ShowsConnection.connectionType,
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

export const partnerArtworksMatchConnection: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: artworkConnection.connectionType,
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

export const partnerArtistsMatchConnection: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: artistConnection.connectionType,
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
