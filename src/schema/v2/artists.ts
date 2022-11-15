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
import { createPageCursors } from "schema/v2/fields/pagination"
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

    return artistsLoader(args).then(({ body }) => body)
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
    } & CursorPageable,
    { artistsLoader, artistLoader, artistsByLetterLoader }
  ) => {
    const gravityArguments = convertConnectionArgsToGravityArgs(args)
    const connectionArguments = convertGravityToConnectionArgs(args)

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

    const { body, headers } = args.letter
      ? await artistsByLetterLoader(args.letter, {
          total_count: true,
          page: gravityArguments.page,
          size: gravityArguments.size,
          ...omit(args, ["first", "last", "before", "after", "letter"]),
        })
      : await artistsLoader({
          total_count: true,
          page: gravityArguments.page,
          size: gravityArguments.size,
          ...omit(args, ["first", "last", "before", "after", "letter"]),
        })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      pageCursors: createPageCursors(
        { page: gravityArguments.page, size: gravityArguments.size, ...args },
        totalCount
      ),
      ...connectionFromArraySlice(body, connectionArguments, {
        arrayLength: totalCount,
        sliceStart: gravityArguments.offset ?? 0,
      }),
    }
  },
}

export default Artists
