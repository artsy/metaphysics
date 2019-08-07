import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInt,
} from "graphql"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { SuggestedArtistsArgs } from "schema/v2/me/suggested_artists_args"
import { artistConnection } from "schema/v2/artist"
import { geneConnection } from "schema/v2/gene"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"
import { assign } from "lodash"
import { connectionFromArraySlice, connectionFromArray } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const RelatedArtistsKind = {
  type: new GraphQLEnumType({
    name: "RelatedArtistsKind",
    values: {
      MAIN: {
        value: "main",
      },
      CONTEMPORARY: {
        value: "contemporary",
      },
    },
  }),
}

export const Related = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "ArtistRelatedData",
    fields: () => ({
      genes: {
        type: geneConnection,
        args: pageable({}),
        resolve: ({ id }, args, { relatedGenesLoader }) => {
          return relatedGenesLoader({ artist: [id] }).then(response => {
            return connectionFromArray(response, args)
          })
        },
      },
      artists: {
        type: artistConnection.connectionType,
        args: pageable({
          excludeArtistsWithoutArtworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
          minForsaleArtworks: {
            type: GraphQLInt,
          },
          kind: RelatedArtistsKind,
        }),
        resolve: (
          { id },
          { excludeArtistsWithoutArtworks, minForsaleArtworks, ..._args },
          { relatedContemporaryArtistsLoader, relatedMainArtistsLoader }
        ) => {
          const args: any = {
            exclude_artists_without_artworks: excludeArtistsWithoutArtworks,
            min_forsale_artworks: minForsaleArtworks,
            ..._args,
          }
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )
          const {
            kind,
            exclude_artists_without_artworks,
            min_forsale_artworks,
          } = args
          const gravityArgs = {
            page,
            size,
            artist: [id],
            total_count: true,
            exclude_artists_without_artworks,
            min_forsale_artworks,
          }

          if (min_forsale_artworks)
            delete gravityArgs.exclude_artists_without_artworks

          const fetch =
            kind === "main"
              ? relatedMainArtistsLoader
              : relatedContemporaryArtistsLoader

          return fetch(gravityArgs).then(({ body, headers }) => {
            const totalCount = parseInt(headers["x-total-count"] || "0", 10)
            const pageCursors = createPageCursors({ page, size }, totalCount)

            return assign({
              pageCursors,
              ...connectionFromArraySlice(body, args, {
                arrayLength: totalCount,
                sliceStart: offset,
              }),
            })
          })
        },
      },

      suggested: {
        type: artistConnection.connectionType,
        args: pageable(SuggestedArtistsArgs),
        description:
          "A list of the current user’s suggested artists, based on a single artist",
        resolve: ({ id }, options, { suggestedArtistsLoader }) => {
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
              const totalCount = parseInt(headers["x-total-count"] || "0", 10)
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
