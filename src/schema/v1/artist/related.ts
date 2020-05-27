import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInt,
} from "graphql"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { SuggestedArtistsArgs } from "schema/v1/me/suggested_artists_args"
import { artistConnection } from "schema/v1/artist"
import { geneConnection } from "schema/v1/gene"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v1/fields/pagination"
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
          return relatedGenesLoader({ artist: [id] }).then((response) => {
            return connectionFromArray(response, args)
          })
        },
      },
      artists: {
        type: artistConnection,
        args: pageable({
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
          min_forsale_artworks: {
            type: GraphQLInt,
          },
          kind: RelatedArtistsKind,
        }),
        resolve: (
          { id },
          args,
          { relatedContemporaryArtistsLoader, relatedMainArtistsLoader }
        ) => {
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
        type: artistConnection,
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
  resolve: (artist) => artist,
}
