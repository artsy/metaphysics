import gql from "lib/gql"
import { GraphQLSchema } from "graphql"
import moment from "moment"
import { defineCustomLocale } from "lib/helpers"
import { toGlobalId } from "graphql-relay"
import { dateRange } from "lib/date"
import { GraphQLSchemaWithTransforms } from "graphql-tools"

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

export const gravityStitchingEnvironment = (
  localSchema: GraphQLSchema,
  gravitySchema: GraphQLSchemaWithTransforms
) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
      extend type Me {
        addressConnection(
          first: Int
          last: Int
          after: String
          before: String
        ): UserAddressConnection
      }

      extend type Partner {
        viewingRoomsConnection(
          first: Int
          after: String
          statuses: [ViewingRoomStatusEnum!]
        ): ViewingRoomsConnection
      }

      extend type Show {
        viewingRoomsConnection: ViewingRoomsConnection
      }

      extend type UserAddress {
        id: ID!
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
        exhibitionPeriod: String
      }

      extend type ViewingRoomPublishedNotificationItem {
        viewingRoomsConnection(
          first: Int
          after: String
          last: Int
          before: String
        ): ViewingRoomsConnection
      }

      extend type Viewer {
        viewingRoomsConnection(
          first: Int
          after: String
          statuses: [ViewingRoomStatusEnum!]
          partnerID: ID
        ): ViewingRoomsConnection
      }

      # Mutation Payloads
      extend type CreateUserAddressPayload {
        me: Me
      }

      extend type UpdateUserAddressPayload {
        me: Me
      }

      extend type DeleteUserAddressPayload {
        me: Me
      }

      extend type UpdateUserDefaultAddressPayload {
        me: Me
      }
    `,
    resolvers: {
      Me: {
        addressConnection: {
          fragment: gql`
          ... on Me {
            __typename
          }
          `,
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "_unused_gravity_userAddressConnection",
              args: { ...args, userId: context.userID },
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
              fieldName: "viewingRoomsConnection",
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
      Show: {
        viewingRoomsConnection: {
          fragment: gql`
            ... on Show {
              viewingRoomIDs
            }
          `,
          resolve: ({ viewingRoomIDs: ids }, _args, context, info) => {
            if (ids.length === 0) return null

            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "viewingRoomsConnection",
              args: {
                ids,
              },
              context,
              info,
            })
          },
        },
      },
      UserAddress: {
        id: {
          fragment: gql`
          ... on UserAddress {
          internalID
          }
          `,
          resolve: (parent, _args, _context, _info) => {
            const internalID = parent.internalID
            return toGlobalId("UserAddress", internalID)
          },
        },
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
              if (endAt > now.clone().add(30, "days")) {
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
        exhibitionPeriod: {
          fragment: gql`
          ... on ViewingRoom {
            startAt
            endAt
          }
        `,
          resolve: ({ startAt: _startAt, endAt: _endAt }) =>
            dateRange(_startAt, _endAt, "UTC"),
        },
      },
      ViewingRoomPublishedNotificationItem: {
        viewingRoomsConnection: {
          fragment: `
            ... on ViewingRoomPublishedNotificationItem {
              viewingRoomIDs
            }
          `,
          resolve: ({ viewingRoomIDs: ids }, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "viewingRoomsConnection",
              args: {
                ...args,
                ids,
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
              fieldName: "viewingRoomsConnection",
              args,
              context,
              info,
            })
          },
        },
      },

      // Mutations
      CreateUserAddressPayload: {
        me: {
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "me",
              args,
              context,
              info,
            })
          },
        },
      },
      UpdateUserAddressPayload: {
        me: {
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "me",
              args,
              context,
              info,
            })
          },
        },
      },
      DeleteUserAddressPayload: {
        me: {
          resolve: (_parent, args, context, info) => {
            console.log("DELETE: DeleteUserAddressPayload")
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "me",
              args,
              context,
              info,
            })
          },
        },
      },
      UpdateUserDefaultAddressPayload: {
        me: {
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "me",
              args,
              context,
              info,
            })
          },
        },
      },
    },
  }
}
