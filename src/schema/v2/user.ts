import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import cached from "./fields/cached"
import { InternalIDFields } from "./object_identification"
import { LocationType } from "schema/v2/location"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "./fields/pagination"

export const UserSaleProfileType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserSaleProfile",
  fields: () => ({
    ...InternalIDFields,
    addressLine1: {
      description: "The first line of address for this user.",
      type: GraphQLString,
      resolve: ({ address_1 }) => address_1,
    },
    addressLine2: {
      description: "The second line of address for this user.",
      type: GraphQLString,
      resolve: ({ address_2 }) => address_2,
    },
    city: {
      description: "The city for this user.",
      type: GraphQLString,
    },
    state: {
      description: "The state for this user.",
      type: GraphQLString,
    },
    zip: {
      description: "The zip for this user.",
      type: GraphQLString,
    },
    country: {
      description: "The country for this user.",
      type: GraphQLString,
    },
  }),
})

export const UserSaleProfileField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The sale profile of the user.",
  type: UserSaleProfileType,
  resolve: ({ sale_profile_id }, {}, { userSaleProfileLoader }) => {
    if (!userSaleProfileLoader) {
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    return userSaleProfileLoader(sale_profile_id).catch((err) => {
      if (err.statusCode === 404) {
        return null
      }
    })
  },
}

export const UserType = new GraphQLObjectType<any, ResolverContext>({
  name: "User",
  fields: () => ({
    ...InternalIDFields,
    cached,
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
    saleProfile: UserSaleProfileField,
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
      resolve: ({ data_transfer_opt_out }) => data_transfer_opt_out,
    },
    paddleNumber: {
      description: "The paddle number of the user",
      type: GraphQLString,
      resolve: ({ paddle_number }) => paddle_number,
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
      resolve: ({ receive_outbid_notification }) => receive_outbid_notification,
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
  }),
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
