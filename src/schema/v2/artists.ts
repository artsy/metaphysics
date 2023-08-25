import Artist, { artistConnection } from "./artist"
import ArtistSorts, { ArtistSort } from "./sorts/artist_sorts"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"
import { CursorPageable, pageable } from "relay-cursor-paging"
import {
  convertConnectionArgsToGravityArgs,
  convertGravityToConnectionArgs,
} from "lib/helpers"
import {
  createPageCursors,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { omit } from "lodash"

const Artists: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Artist.type),
  description: "A list of Artists",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return artists matching specified ids.
        Accepts list of ids.
      `,
    },
    slugs: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return artists matching specified slugs.
        Accepts list of slugs. (e.g. 'andy-warhol', 'banksy')
      `,
    },
    page: {
      type: GraphQLInt,
      defaultValue: 1,
    },
    size: {
      type: GraphQLInt,
    },
    sort: ArtistSorts,
  },
  resolve: (_root, args, { artistLoader, artistsLoader }) => {
    if (args.slugs) {
      return Promise.all(
        args.slugs.map((slug) =>
          artistLoader(
            slug,
            {},
            {
              requestThrottleMs: config.ARTICLE_REQUEST_THROTTLE_MS,
            }
          )
        )
      )
    }

    return artistsLoader(args).then(({ body }) => {
      return body
    })
  },
}

export const artistsConnection = {
  type: artistConnection.connectionType,
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return artists matching specified ids.
        Accepts list of ids.
      `,
    },
    slugs: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return artists matching specified slugs.
        Accepts list of slugs. (e.g. 'andy-warhol', 'banksy')
      `,
    },
    letter: { type: GraphQLString },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    sort: ArtistSorts,
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
  }),
  description: "A list of artists",
  resolve: async (
    _root,
    args: {
      ids?: string[]
      slugs?: string[]
      letter?: string
      page?: number
      size?: number
      sort?: ArtistSort
      term?: string
    } & CursorPageable,
    { artistsLoader, artistLoader, artistsByLetterLoader, matchArtistsLoader }
  ) => {
    const gravityArguments = convertConnectionArgsToGravityArgs(args)
    const connectionArguments = convertGravityToConnectionArgs(args)

    if (args.term) {
      const { term } = args

      const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

      const gravityArgs: {
        page: number
        size: number
        total_count: boolean
        term?: string
        id?: string[]
      } = { page, size, term, total_count: true }

      const { body, headers } = await matchArtistsLoader(gravityArgs)

      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({
        args,
        body,
        offset,
        page,
        size,
        totalCount,
      })
    }

    if (args.slugs) {
      return Promise.all(
        args.slugs.map((slug) => {
          return artistLoader(
            slug,
            {},
            { requestThrottleMs: config.ARTICLE_REQUEST_THROTTLE_MS }
          )
        })
      ).then((body) => {
        return {
          totalCount: body.length,
          pageCursors: createPageCursors(
            { page: 1, size: body.length },
            body.length
          ),
          ...connectionFromArraySlice(body, connectionArguments, {
            arrayLength: body.length,
            sliceStart: gravityArguments.offset ?? 0,
          }),
        }
      })
    }

    if (args.letter) {
      const { body, headers } = await artistsByLetterLoader(args.letter, {
        total_count: true,
        page: gravityArguments.page,
        size: gravityArguments.size,
        ...omit(args, ["first", "last", "before", "after", "letter"]),
      })

      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({
        args,
        body,
        offset: gravityArguments.offset,
        page: gravityArguments.page,
        size: gravityArguments.size,
        totalCount,
      })
    }

    // Default case
    const { body, headers } = await artistsLoader({
      total_count: true,
      page: gravityArguments.page,
      size: gravityArguments.size,
      ...omit(args, ["first", "last", "before", "after", "letter"]),
    })

    const totalCount =
      args.ids && args.ids.length > 0
        ? body.length
        : parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset: gravityArguments.offset,
      page: gravityArguments.page,
      size: gravityArguments.size,
      totalCount,
    })
  },
}

export default Artists
