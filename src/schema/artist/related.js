import { GraphQLBoolean, GraphQLObjectType } from "graphql"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { SuggestedArtistsArgs } from "schema/me/suggested_artists_args"
import { artistConnection } from "schema/artist"
import { parseRelayOptions } from "lib/helpers"
import { createPageCursors } from "schema/fields/pagination"
import { assign } from "lodash"
import { connectionFromArraySlice } from "graphql-relay"

export const RelatedArtists = {
  type: new GraphQLObjectType({
    name: "RelatedArtists",
    fields: () => ({
      contemporary: {
        type: artistConnection,
        args: pageable({
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        }),
        resolve: (
          { id },
          args,
          _request,
          { rootValue: { relatedContemporaryArtistsLoader } }
        ) => {
          const { page, size, offset } = parseRelayOptions(args)
          const { exclude_artists_without_artworks } = args
          const gravityArgs = {
            page,
            size,
            artist: [id],
            total_count: true,
            exclude_artists_without_artworks,
          }

          return relatedContemporaryArtistsLoader(gravityArgs).then(
            ({ body, headers }) => {
              const totalCount = headers["x-total-count"]
              const pageCursors = createPageCursors({ page, size }, totalCount)

              return assign({
                pageCursors,
                ...connectionFromArraySlice(body, args, {
                  arrayLength: totalCount,
                  sliceStart: offset,
                }),
              })
            }
          )
        },
      },
      main: {
        type: artistConnection,
        args: pageable({
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        }),
        resolve: (
          { id },
          args,
          _request,
          { rootValue: { relatedMainArtistsLoader } }
        ) => {
          const { page, size, offset } = parseRelayOptions(args)
          const { exclude_artists_without_artworks } = args
          const gravityArgs = {
            page,
            size,
            artist: [id],
            total_count: true,
            exclude_artists_without_artworks,
          }

          return relatedMainArtistsLoader(gravityArgs).then(
            ({ body, headers }) => {
              const totalCount = headers["x-total-count"]
              const pageCursors = createPageCursors({ page, size }, totalCount)
              debugger
              return assign({
                pageCursors,
                ...connectionFromArraySlice(body, args, {
                  arrayLength: totalCount,
                  sliceStart: offset,
                }),
              })
            }
          )
        },
      },
      suggested: {
        type: artistConnection,
        args: pageable(SuggestedArtistsArgs),
        description:
          "A list of the current user’s suggested artists, based on a single artist",
        resolve: (
          { id },
          options,
          request,
          { rootValue: { suggestedArtistsLoader } }
        ) => {
          if (!suggestedArtistsLoader) return null
          const { offset } = getPagingParameters(options)
          const gravityOptions = assign(
            { artist_id: id, total_count: true },
            options,
            {}
          )
          return suggestedArtistsLoader(gravityOptions).then(
            ({ body, headers }) => {
              const suggestedArtists = body
              const totalCount = headers["x-total-count"]
              return connectionFromArraySlice(suggestedArtists, options, {
                arrayLength: totalCount,
                sliceStart: offset,
              })
            }
          )
        },
      },
    }),
  }),
  resolve: artist => artist,
}
