import gql from "lib/gql"
import { GraphQLSchema } from "graphql"

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
          resolve: ({ internalID: partner_id }, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "viewingRooms",
              args: {
                partner_id,
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
