import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import cached from "./fields/cached"
import { InternalIDFields, NodeInterface } from "./object_identification"
import { LocationType } from "schema/v2/location"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  createPageCursors,
  paginationResolver,
} from "./fields/pagination"
import { date } from "./fields/date"
import { CollectorProfileType } from "./CollectorProfile/collectorProfile"
import { UserSaleProfile } from "./userSaleProfile"
import { UserInterestConnection } from "./userInterests"
import { pageable } from "relay-cursor-paging"
import {
  CatchCollectionNotFoundException,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { artworkConnection } from "./artwork"
import { artistConnection } from "./artist"
import { geneConnection } from "./gene"

export const UserAdminNoteType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserAdminNotes",
  fields: () => ({
    ...InternalIDFields,
    body: {
      description: "The body of the admin note",
      type: new GraphQLNonNull(GraphQLString),
    },
    createdAt: date(({ created_at }) => created_at),
  }),
})

export const UserAdminNotesField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The admin notes associated with the user",
  type: new GraphQLNonNull(new GraphQLList(UserAdminNoteType)),
  resolve: async ({ id }, {}, { userAdminNotesLoader }) => {
    if (!userAdminNotesLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    return await userAdminNotesLoader(id)
  },
}

export const PartnerAccessField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The Parnter or Profile access granted to the user",
  type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
  resolve: async ({ id }, {}, { userAccessControlLoader }) => {
    if (!userAccessControlLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const access_controls = await userAccessControlLoader({
      id,
      access_control_model: "partner",
    })

    return access_controls.map((partner) => partner.property.name)
  },
}

export const ProfileAccessField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The Parnter or Profile access granted to the user",
  type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
  resolve: async ({ id }, {}, { userAccessControlLoader }) => {
    if (!userAccessControlLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const access_controls = await userAccessControlLoader({
      id,
      access_control_model: "profile",
    })

    return access_controls.map((profile) => profile.property.name)
  },
}

export const UserType = new GraphQLObjectType<any, ResolverContext>({
  name: "User",
  interfaces: [NodeInterface],
  fields: () => {
    const { UserPurchasesConnection } = require("./userPurchases")
    const { UserInquiredArtworksConnection } = require("./userInquiredArtworks")
    return {
      ...InternalIDFields,
      cached,
      adminNotes: UserAdminNotesField,
      collectorProfile: {
        type: CollectorProfileType,
        resolve: async ({ id: user_id }, {}, { collectorProfilesLoader }) => {
          if (!collectorProfilesLoader)
            throw new Error(
              "Loader not found. You must supply an X-Access-Token header."
            )

          const { body: profiles } = await collectorProfilesLoader({
            user_id,
          })

          // It's ok if `profiles` is an empty array.
          return profiles[0]
        },
      },
      name: {
        description: "The given name of the user.",
        type: new GraphQLNonNull(GraphQLString),
      },
      email: {
        description: "The given email of the user.",
        type: new GraphQLNonNull(GraphQLString),
      },
      phone: {
        description: "The given phone number of the user.",
        type: GraphQLString,
      },
      createdAt: date(({ created_at }) => created_at),
      emailConfirmedAt: date(({ email_confirmed_at }) => email_confirmed_at),
      secondFactorEnabled: {
        description:
          "If the user has enabled two-factor authentication on their account",
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: ({ second_factor_enabled }) => second_factor_enabled,
      },
      roles: {
        description: "The roles of the user",
        type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      },
      signInCount: {
        description: "The number of times a user has signed in",
        type: new GraphQLNonNull(GraphQLInt),
        resolve: ({ sign_in_count }) => sign_in_count,
      },
      lastSignInAt: date(({ last_sign_in_at }) => last_sign_in_at),
      saleProfile: UserSaleProfile,
      location: {
        description: "The given location of the user as structured data",
        type: LocationType,
      },
      priceRange: {
        description: "The price range the collector has selected",
        type: GraphQLString,
        resolve: ({ price_range }) => price_range,
      },
      pin: {
        description: "Pin for bidding at an auction",
        type: GraphQLString,
      },
      dataTransferOptOut: {
        description: "Has the user opted out of data transfer.",
        type: GraphQLBoolean,
        resolve: async ({ data_transfer_opt_out }) => data_transfer_opt_out,
      },
      inquiredArtworksConnection: {
        type: UserInquiredArtworksConnection,
        args: pageable({}),
        resolve: async ({ id }, args, { userInquiryRequestsLoader }) => {
          if (!userInquiryRequestsLoader) {
            throw new Error(
              "Loader not found. You must supply an X-Access-Token header."
            )
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )
          const { body, headers } = await userInquiryRequestsLoader(id, {
            page,
            size,
            total_count: true,
          })
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArraySlice(body, args, {
              arrayLength: totalCount,
              sliceStart: offset,
              resolveNode: (node) => node.inquireable,
            }),
          }
        },
      },
      interestsConnection: {
        type: UserInterestConnection,
        args: pageable({}),
        resolve: async ({ id }, args, { userInterestsLoader }) => {
          if (!userInterestsLoader) {
            throw new Error(
              "Loader not found. You must supply an X-Access-Token header."
            )
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )
          const { body, headers } = await userInterestsLoader(id, {
            page,
            size,
            total_count: true,
          })
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            ...connectionFromArraySlice(body, args, {
              arrayLength: totalCount,
              sliceStart: offset,
              resolveNode: (node) => node.interest,
            }),
          }
        },
      },
      follows: {
        type: new GraphQLObjectType({
          name: "UserFollows",
          fields: {
            artistsConnection: {
              type: artistConnection.connectionType,
              args: pageable({}),
              resolve: async ({ id }, args, { userArtistFollowsLoader }) => {
                if (!userArtistFollowsLoader) {
                  throw new Error(
                    "Loader not found. You must supply an X-Access-Token header."
                  )
                }
                const {
                  page,
                  size,
                  offset,
                } = convertConnectionArgsToGravityArgs(args)

                const { body, headers } = await userArtistFollowsLoader(id, {
                  page,
                  size,
                  total_count: true,
                })
                const totalCount = parseInt(headers["x-total-count"] || "0", 10)
                return paginationResolver({
                  totalCount,
                  offset,
                  page,
                  size,
                  body,
                  args,
                })
              },
            },
            genesConnection: {
              type: geneConnection,
              args: pageable({}),
              resolve: async ({ id }, args, { userGeneFollowsLoader }) => {
                if (!userGeneFollowsLoader) {
                  throw new Error(
                    "Loader not found. You must supply an X-Access-Token header."
                  )
                }
                const {
                  page,
                  size,
                  offset,
                } = convertConnectionArgsToGravityArgs(args)

                const { body, headers } = await userGeneFollowsLoader(id, {
                  page,
                  size,
                  total_count: true,
                })
                const totalCount = parseInt(headers["x-total-count"] || "0", 10)
                return paginationResolver({
                  totalCount,
                  offset,
                  page,
                  size,
                  body,
                  args,
                })
              },
            },
          },
        }),
        resolve: (result) => result,
      },
      paddleNumber: {
        description: "The paddle number of the user",
        type: GraphQLString,
        resolve: ({ paddle_number }) => paddle_number,
      },
      partnerAccess: PartnerAccessField,
      profileAccess: ProfileAccessField,
      purchasedArtworksConnection: {
        type: UserPurchasesConnection,
        args: pageable({}),
        resolve: async ({ id }, args, { purchasesLoader }) => {
          if (!purchasesLoader) {
            throw new Error(
              "Loader not found. You must supply an X-Access-Token header."
            )
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )
          const { body, headers } = await purchasesLoader({
            page,
            size,
            total_count: true,
            user_id: id,
          })
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArraySlice(body, args, {
              arrayLength: totalCount,
              sliceStart: offset,
              resolveNode: (node) => node.artwork,
            }),
          }
        },
      },
      receivePurchaseNotification: {
        description: "This user should receive purchase notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_purchase_notification }) =>
          receive_purchase_notification,
      },
      receiveOutbidNotification: {
        description: "This user should receive outbid notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_outbid_notification }) =>
          receive_outbid_notification,
      },
      receiveLotOpeningSoonNotification: {
        description: "This user should receive lot opening notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_lot_opening_soon_notification }) =>
          receive_lot_opening_soon_notification,
      },
      receiveSaleOpeningClosingNotification: {
        description:
          "This user should receive sale opening/closing notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_sale_opening_closing_notification }) =>
          receive_sale_opening_closing_notification,
      },
      receiveNewWorksNotification: {
        description: "This user should receive new works notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_new_works_notification }) =>
          receive_new_works_notification,
      },
      receiveNewSalesNotification: {
        description: "This user should receive new sales notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_new_sales_notification }) =>
          receive_new_sales_notification,
      },
      receivePromotionNotification: {
        description: "This user should receive promotional notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_promotion_notification }) =>
          receive_promotion_notification,
      },
      receiveOrderNotification: {
        description: "This user should receive order notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_order_notification }) => receive_order_notification,
      },
      receiveViewingRoomNotification: {
        description: "This user should receive viewing room notifications",
        type: GraphQLBoolean,
        resolve: ({ receive_viewing_room_notification }) =>
          receive_viewing_room_notification,
      },
      savedArtworksConnection: {
        type: artworkConnection.connectionType,
        args: pageable({}),
        resolve: async ({ id }, args, { savedArtworksLoader }) => {
          if (!savedArtworksLoader) return null

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const gravityOptions = {
            page,
            size,
            user_id: id,
            private: true,
            total_count: true,
            sort: "-position",
          }

          try {
            const { body, headers } = await savedArtworksLoader(gravityOptions)

            const totalCount = parseInt(headers["x-total-count"] || "0", 10)
            return paginationResolver({
              totalCount,
              offset,
              page,
              size,
              body,
              args,
            })
          } catch (error) {
            return CatchCollectionNotFoundException(error)
          }
        },
      },
      userAlreadyExists: {
        description:
          "Check whether a user exists by email address before creating an account.",
        type: GraphQLBoolean,
        resolve: ({ id }) => {
          if (id) {
            return true
          }
          return false
        },
      },
    }
  },
})

export const UserField: GraphQLFieldConfig<void, ResolverContext> = {
  type: UserType,
  args: {
    email: {
      type: GraphQLString,
      description: "Email to search for user by",
    },
    id: {
      type: GraphQLString,
      description: "ID of the user",
    },
  },
  resolve: (_root, option, { userByEmailLoader, userByIDLoader }) => {
    const promise = option.id
      ? userByIDLoader(option.id)
      : userByEmailLoader(option)
    return promise
      .then((result) => {
        return result
      })
      .catch((err) => {
        if (err.statusCode === 404) {
          return false
        }
      })
  },
}

export const UsersConnection = connectionWithCursorInfo({ nodeType: UserType })

export default UserField
