import gql from "lib/gql"
import { GraphQLSchema } from "graphql"
import moment from "moment"

export const gravityStitchingEnvironment = (
  localSchema: GraphQLSchema,
  gravitySchema: GraphQLSchema & { transforms: any }
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
        formattedStartAt(short: Boolean! = false): String
        formattedEndAt(short: Boolean! = false): String
        partner: Partner
      }

      extend type Partner {
        viewingRoomsConnection: ViewingRoomConnection
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
                ...args,
              },
              context,
              info,
            })
          },
        },
        formattedStartAt: {
          fragment: gql`
            ... on ViewingRoom {
              startAt
            }
		  `,
          resolve: ({ startAt: _startAt }, { short = false }) => {
            if (short) {
              moment.updateLocale("en", {
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
            } else {
              moment.updateLocale("en", {
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
            }

            if (_startAt === null) {
              return null
            }

            const startAt = moment(_startAt)
            const now = moment()

            if (startAt < now) {
              return null
            }

            if (short === false && startAt > now.clone().add(30, "days")) {
              return null
            }

            return `${moment
              .duration(startAt.diff(now))
              .humanize(short, { ss: 1, d: 31 })}`
          },
        },
        formattedEndAt: {
          fragment: gql`
            ... on ViewingRoom {
              startAt
              endAt
            }
          `,
          resolve: ({ startAt: _startAt, endAt: _endAt }) => {
            moment.updateLocale("en", {
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

            if (_startAt === null || _endAt === null) {
              return null
            }

            const startAt = moment(_startAt)
            const endAt = moment(_endAt)
            const now = moment()

            if (now < startAt || endAt > now.clone().add(30, "days")) {
              return null
            }

            if (now > endAt) {
              return null
            }

            return `${moment
              .duration(endAt.diff(now))
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
      Partner: {
        viewingRoomsConnection: {
          fragment: gql`
            ... on Partner {
              internalID
            }
          `,
          resolve: ({ internalID: partnerId }, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "viewingRooms",
              args: {
                partnerId,
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
