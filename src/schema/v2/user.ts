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
import { InternalIDFields } from "./object_identification"
import { LocationType } from "schema/v2/location"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "./fields/pagination"
import { date } from "./fields/date"
import { CollectorProfile } from "./CollectorProfile/collectorProfile"

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

export const UserSaleProfileField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The sale profile of the user.",
  type: UserSaleProfileType,
  resolve: ({ sale_profile_id }, {}, { userSaleProfileLoader }) => {
    if (!userSaleProfileLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    return userSaleProfileLoader(sale_profile_id).catch((err) => {
      if (err.statusCode === 404) {
        return null
      }
    })
  },
}

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
  fields: () => ({
    ...InternalIDFields,
    cached,
    adminNotes: UserAdminNotesField,
    collectorProfile: CollectorProfile,
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
    partnerAccess: PartnerAccessField,
    profileAccess: ProfileAccessField,
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
