import {
  GraphQLBoolean,
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

export const EmailAccountProviderEnum = new GraphQLEnumType({
  name: "EmailAccountProvider",
  values: {
    GMAIL: { value: "gmail" },
    OUTLOOK: { value: "outlook" },
  },
})

export const EmailAccountStatusEnum = new GraphQLEnumType({
  name: "EmailAccountStatus",
  values: {
    ACTIVE: { value: "active" },
    EXPIRED: { value: "expired" },
    ERROR: { value: "error" },
    DISCONNECTED: { value: "disconnected" },
  },
})

export const EmailAccountType = new GraphQLObjectType<any, ResolverContext>({
  name: "EmailAccount",
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
    provider: {
      type: EmailAccountProviderEnum,
    },
    providerAccountId: {
      type: GraphQLString,
      resolve: ({ provider_account_id }) => provider_account_id,
    },
    emailAddress: {
      type: GraphQLString,
      resolve: ({ email_address }) => email_address,
    },
    status: {
      type: EmailAccountStatusEnum,
    },
    scopes: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "The permissions granted by the user to this mailbox",
    },
    syncEnabled: {
      type: GraphQLBoolean,
      resolve: ({ sync_enabled }) => sync_enabled,
    },
    shareContentWithPartner: {
      type: GraphQLBoolean,
      description: "Whether colleagues at the partner can read message content",
      resolve: ({ share_content_with_partner }) => share_content_with_partner,
    },
    captureSentMail: {
      type: GraphQLBoolean,
      description: "Whether mail sent from this mailbox is also stored",
      resolve: ({ capture_sent_mail }) => capture_sent_mail,
    },
    lastError: {
      type: GraphQLString,
      description: "Why the connection last stopped working, if it did",
      resolve: ({ last_error }) => last_error,
    },
    connectedAt: date(),
    lastSyncedAt: date(),
    lapsedAt: date(),
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const emailAccounts: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(new GraphQLNonNull(EmailAccountType)),
  description: "A list of email accounts connected by the current user",
  args: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to filter accounts by",
    },
  },
  resolve: async (_root, { partnerId }, { emailAccountsLoader }) => {
    if (!emailAccountsLoader) return []
    const { body } = await emailAccountsLoader({ partner_id: partnerId })
    return body
  },
}
