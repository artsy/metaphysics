import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"

export const InstagramAccountStatusEnum = new GraphQLEnumType({
  name: "InstagramAccountStatus",
  values: {
    ACTIVE: { value: "active" },
    EXPIRED: { value: "expired" },
    ERROR: { value: "error" },
    DISCONNECTED: { value: "disconnected" },
  },
})

export const InstagramAccountType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "InstagramAccount",
    fields: () => ({
      ...InternalIDFields,
      partnerId: {
        type: GraphQLString,
        resolve: ({ partner_id }) => partner_id,
      },
      userId: {
        type: GraphQLString,
        resolve: ({ user_id }) => user_id,
      },
      providerAccountId: {
        type: GraphQLString,
        resolve: ({ provider_account_id }) => provider_account_id,
      },
      username: {
        type: GraphQLString,
      },
      accountName: {
        type: GraphQLString,
        resolve: ({ account_name }) => account_name,
      },
      status: {
        type: InstagramAccountStatusEnum,
      },
      connectedAt: date(),
      lastSyncedAt: date(),
      tokenExpiresAt: date(),
      createdAt: date(),
      updatedAt: date(),
    }),
  }
)

export const instagramAccounts: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(InstagramAccountType))
  ),
  description: "A list of Instagram accounts connected by the current user",
  args: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to filter accounts by",
    },
  },
  resolve: async (_root, { partnerId }, { instagramAccountsLoader }) => {
    if (!instagramAccountsLoader) return []
    const { body } = await instagramAccountsLoader({ partner_id: partnerId })
    return body
  },
}
