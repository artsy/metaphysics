import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} from "graphql"
import { pageable, getPagingParameters } from "relay-cursor-paging"
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
          return relatedGenesLoader({ artist: [id] }).then((response) => {
            return connectionFromArray(response, args)
          })
        },
      },
      artistsConnection: {
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
      suggestedConnection: {
        type: artistConnection.connectionType,
        args: pageable({
          excludeArtistsWithoutForsaleArtworks: {
            type: GraphQLBoolean,
            description: "Exclude artists without for sale works",
          },
          excludeArtistsWithoutArtworks: {
            type: GraphQLBoolean,
            description: "Exclude artists without any artworks",
          },
          excludeFollowedArtists: {
            type: GraphQLBoolean,
            description: "Exclude artists the user already follows",
          },
          excludeArtistIDs: {
            type: new GraphQLList(GraphQLString),
            description:
              "Exclude these ids from results, may result in all artists being excluded.",
          },
        }),
        description:
          "A list of the current user’s suggested artists, based on a single artist",
        resolve: (
          { id },
          {
            excludeArtistsWithoutForsaleArtworks,
            excludeArtistsWithoutArtworks,
            excludeFollowedArtists,
            excludeArtistIDs,
            ..._args
          },
          { suggestedArtistsLoader }
        ) => {
          if (!suggestedArtistsLoader) return null

          const args = {
            exclude_artists_without_forsale_artworks: excludeArtistsWithoutForsaleArtworks,
            exclude_artists_without_artworks: excludeArtistsWithoutArtworks,
            exclude_followed_artists: excludeFollowedArtists,
            exclude_artist_ids: excludeArtistIDs,
            ..._args,
          } as any

          const { offset } = getPagingParameters(args)
          const gravityOptions = assign(
            { artist_id: id, total_count: true },
            args,
            {}
          )
          return suggestedArtistsLoader(gravityOptions).then(
            ({ body, headers }) => {
              const suggestedArtists = body
              const totalCount = parseInt(headers["x-total-count"] || "0", 10)
              return connectionFromArraySlice(suggestedArtists, args, {
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
