import gql from "lib/gql"
import {
  GraphQLSchema,
  GraphQLFieldConfigArgumentMap,
  GraphQLType,
  isScalarType,
  isListType,
  isEnumType,
} from "graphql"
import moment from "moment"
import { defineCustomLocale } from "lib/helpers"
import { pageableFilterArtworksArgs } from "schema/v2/filterArtworksConnection"
import { normalizeImageData, getDefault } from "schema/v2/image"

const LocaleEnViewingRoomRelativeShort = "en-viewing-room-relative-short"
defineCustomLocale(LocaleEnViewingRoomRelativeShort, {
  parentLocale: "en",
  relativeTime: {
    future: "soon",
    s: "",
    ss: "",
    m: "",
    mm: "",
    h: "",
    hh: "",
    d: "",
    dd: "",
    M: "",
    MM: "",
    y: "",
    yy: "",
  },
})

const LocaleEnViewingRoomRelativeLong = "en-viewing-room-relative-long"
defineCustomLocale(LocaleEnViewingRoomRelativeLong, {
  parentLocale: "en",
  relativeTime: {
    s: "%d second",
    ss: "%d seconds",
    m: "%d minute",
    mm: "%d minutes",
    h: "%d hour",
    hh: "%d hours",
    d: "%d day",
    dd: "%d days",
    M: "%d month",
    MM: "%d months",
    y: "%d year",
    yy: "%d years",
  },
})

function argsToSDL(args: GraphQLFieldConfigArgumentMap) {
  const result: string[] = []
  Object.keys(args).forEach((argName) => {
    result.push(`${argName}: ${printType(args[argName].type)}`)
  })
  return result
}

function printType(type: GraphQLType): string {
  if (isScalarType(type)) {
    return type.name
  } else if (isListType(type)) {
    return `[${printType(type.ofType)}]`
  } else if (isEnumType(type)) {
    return type.name
  } else {
    throw new Error(`Unknown type: ${JSON.stringify(type)}`)
  }
}

export const gravityStitchingEnvironment = (
  localSchema: GraphQLSchema,
  gravitySchema: GraphQLSchema & { transforms: any },
  schemaVersion: number
) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
      extend type Me {
        secondFactors(kinds: [SecondFactorKind]): [SecondFactor]
      }

      extend type ViewingRoom {
        artworksConnection(
          first: Int
          last: Int
          after: String
          before: String
        ): ArtworkConnection
        partnerArtworksConnection(
          first: Int
          last: Int
          after: String
          before: String
        ): ArtworkConnection
        distanceToOpen(short: Boolean! = false): String
        distanceToClose(short: Boolean! = false): String
        partner: Partner
      }

      extend type ArtistSeries {
        artists(page: Int, size: Int): [Artist]
        image: Image
        ${
          schemaVersion === 2
            ? `filterArtworksConnection(${argsToSDL(
                pageableFilterArtworksArgs
              ).join("\n")}): FilterArtworksConnection`
            : ""
        }
      }

      extend type Partner {
        viewingRoomsConnection(published: Boolean = true): ViewingRoomConnection
      }

      extend type Artist {
        artistSeriesConnection: ArtistSeriesConnection
      }

      extend type Viewer {
        viewingRoomsConnection(first: Int, after: String): ViewingRoomConnection
      }
    `,
    resolvers: {
      Me: {
        secondFactors: {
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "_unused_gravity_secondFactors",
              args: args,
              context,
              info,
            })
          },
        },
      },
      ArtistSeries: {
        image: {
          fragment: gql`
          ... on ArtistSeries {
            image_url: imageURL
            original_height: imageHeight
            original_width: imageWidth
            representativeArtworkID
          }
          `,
          resolve: async (
            {
              representativeArtworkID,
              image_url,
              original_height,
              original_width,
            },
            args,
            context,
            info
          ) => {
            if (image_url) {
              context.imageData = {
                image_url,
                original_width,
                original_height,
              }
            } else if (representativeArtworkID) {
              const { artworkLoader } = context
              const { images } = await artworkLoader(representativeArtworkID)
              context.imageData = normalizeImageData(getDefault(images))
            }

            return info.mergeInfo.delegateToSchema({
              args,
              schema: localSchema,
              operation: "query",
              fieldName: "_do_not_use_image",
              context,
              info,
            })
          },
        },
        artists: {
          fragment: gql`
          ... on ArtistSeries {
            artistIDs
          }
        `,
          resolve: ({ artistIDs: ids }, args, context, info) => {
            if (ids.length === 0) {
              return []
            }

            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artists",
              args: {
                ids,
                ...args,
              },
              context,
              info,
            })
          },
        },
        ...(schemaVersion === 2 && {
          filterArtworksConnection: {
            fragment: `
          ... on ArtistSeries {
            internalID
          }
        `,
            resolve: ({ internalID: artistSeriesID }, args, context, info) => {
              return info.mergeInfo.delegateToSchema({
                schema: localSchema,
                operation: "query",
                fieldName: "artworksConnection",
                args: {
                  artistSeriesID,
                  ...args,
                },
                context,
                info,
              })
            },
          },
        }),
      },
      ViewingRoom: {
        artworksConnection: {
          fragment: gql`
            ... on ViewingRoom {
              artworkIDs
            }
          `,
          resolve: ({ artworkIDs: ids }, args, context, info) => {
            // qs ignores empty array/object and prevents us from sending `?array[]=`.
            // This is a workaround to map an empty array to `[null]` so it gets treated
            // as an empty string.
            // https://github.com/ljharb/qs/issues/362
            //
            // Note that we can't easily change this globally as there are multiple places
            // clients are sending params of empty array but expecting Gravity to return
            // non-empty data. This only fixes the issue for viewing room artworks.
            if (ids.length === 0) {
              ids = [null]
            }

            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artworks",
              args: {
                ids,
                respectParamsOrder: true,
                ...args,
              },
              context,
              info,
            })
          },
        },
        partnerArtworksConnection: {
          fragment: gql`
            ... on ViewingRoom {
              internalID
              partnerID
            }
          `,
          resolve: (
            { internalID: viewingRoomID, partnerID },
            args,
            context,
            info
          ) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "partnerArtworks",
              args: {
                viewingRoomID,
                partnerID,
                ...args,
              },
              context,
              info,
            })
          },
        },
        distanceToOpen: {
          fragment: gql`
            ... on ViewingRoom {
              startAt
            }
		  `,
          resolve: (
            { startAt: _startAt }: { startAt: string | null },
            { short = false }: { short?: boolean }
          ) => {
            if (_startAt === null) {
              return null
            }

            const startAt = moment(_startAt)
            const now = moment()

            if (startAt < now) {
              return null
            }

            if (!short && startAt > now.clone().add(30, "days")) {
              return null
            }

            const distance = moment.duration(startAt.diff(now))
            return distance
              .locale(
                short
                  ? LocaleEnViewingRoomRelativeShort
                  : LocaleEnViewingRoomRelativeLong
              )
              .humanize(short, { ss: 1, d: 31 })
          },
        },
        distanceToClose: {
          fragment: gql`
            ... on ViewingRoom {
              startAt
              endAt
            }
          `,
          resolve: (
            {
              startAt: _startAt,
              endAt: _endAt,
            }: { startAt: string | null; endAt: string | null },
            { short = false }: { short?: boolean }
          ) => {
            if (_startAt === null || _endAt === null) {
              return null
            }

            const startAt = moment(_startAt)
            const endAt = moment(_endAt)
            const now = moment()

            if (startAt > now) {
              return null
            }

            if (endAt < now) {
              return null
            }

            if (short) {
              if (endAt > now.clone().add(5, "days")) {
                return null
              }
            } else {
              if (endAt > now.clone().add(10, "days")) {
                return null
              }
            }

            return `${moment
              .duration(endAt.diff(now))
              .locale(LocaleEnViewingRoomRelativeLong)
              .humanize(false, { ss: 1, d: 31 })}`
          },
        },
        partner: {
          fragment: gql`
            ... on ViewingRoom {
              partnerID
            }
          `,
          resolve: ({ partnerID: id }, _args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "partner",
              args: {
                id,
              },
              context,
              info,
            })
          },
        },
      },
      Viewer: {
        viewingRoomsConnection: {
          fragment: `
          ... on Viewer {
            __typename
          }`,
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "viewingRooms",
              args,
              context,
              info,
            })
          },
        },
      },
      Partner: {
        viewingRoomsConnection: {
          fragment: gql`
            ... on Partner {
              internalID
            }
          `,
          resolve: ({ internalID: partnerID }, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "viewingRooms",
              args: {
                partnerID,
                ...args,
              },
              context,
              info,
            })
          },
        },
      },
      Artist: {
        artistSeriesConnection: {
          fragment: gql`
            ... on Artist {
              internalID
            }
          `,
          resolve: ({ internalID: artistID }, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "artistSeriesConnection",
              args: {
                artistID,
                ...args,
              },
              context,
              info,
            })
          },
        },
      },
    },
  }
}
