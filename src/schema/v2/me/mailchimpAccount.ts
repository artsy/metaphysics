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

export const MailchimpAccountStatusEnum = new GraphQLEnumType({
  name: "MailchimpAccountStatus",
  values: {
    ACTIVE: { value: "active" },
    EXPIRED: { value: "expired" },
    ERROR: { value: "error" },
    DISCONNECTED: { value: "disconnected" },
  },
})

export const MailchimpListType = new GraphQLObjectType<any, ResolverContext>({
  name: "MailchimpList",
  fields: () => ({
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The Mailchimp list/audience ID",
      resolve: ({ id }) => id,
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the Mailchimp list/audience",
    },
  }),
})

export const MailchimpAccountType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "MailchimpAccount",
    fields: () => ({
      ...InternalIDFields,
      partnerId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ partner_id }) => partner_id,
      },
      userId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ user_id }) => user_id,
      },
      providerAccountId: {
        type: GraphQLString,
        resolve: ({ provider_account_id }) => provider_account_id,
      },
      accountName: {
        type: GraphQLString,
        resolve: ({ account_name }) => account_name,
      },
      email: {
        type: GraphQLString,
      },
      serverPrefix: {
        type: GraphQLString,
        resolve: ({ server_prefix }) => server_prefix,
      },
      apiEndpoint: {
        type: GraphQLString,
        resolve: ({ api_endpoint }) => api_endpoint,
      },
      status: {
        type: MailchimpAccountStatusEnum,
      },
      lists: {
        type: new GraphQLList(new GraphQLNonNull(MailchimpListType)),
        description: "Mailchimp audience lists for this account",
        resolve: async ({ id }, _args, { mailchimpAccountListsLoader }) => {
          if (!mailchimpAccountListsLoader) return null
          const result = await mailchimpAccountListsLoader(id)
          return result.lists
        },
      },
      connectedAt: date(),
      lastSyncedAt: date(),
      createdAt: date(),
      updatedAt: date(),
    }),
  }
)

export const mailchimpAccounts: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(MailchimpAccountType))
  ),
  description: "A list of Mailchimp accounts connected by the current user",
  args: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to filter accounts by",
    },
  },
  resolve: async (_root, { partnerId }, { mailchimpAccountsLoader }) => {
    if (!mailchimpAccountsLoader) return []
    const { body } = await mailchimpAccountsLoader({ partner_id: partnerId })
    return body
  },
}
