import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { omitBy, isNil } from "lodash"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"

export const EmailSenderReviewStatusEnum = new GraphQLEnumType({
  name: "EmailSenderReviewStatus",
  values: {
    PENDING: { value: "pending" },
    APPROVED: { value: "approved" },
    SKIPPED: { value: "skipped" },
  },
})

// One row per unknown email sender a partner's connected mailbox has seen.
// Mail from the sender is withheld until the review is approved or skipped.
export const EmailSenderReviewType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "EmailSenderReview",
  fields: () => ({
    ...InternalIDFields,
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    emailAccountID: {
      type: GraphQLString,
      description: "The mailbox the sender was first seen through",
      resolve: ({ email_account_id }) => email_account_id,
    },
    address: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The sender's email address",
    },
    name: {
      type: GraphQLString,
      description: "The sender's display name, if known",
    },
    toAddress: {
      type: GraphQLString,
      description: "The first recipient address, to tell mailboxes apart",
      resolve: ({ to_address }) => to_address,
    },
    status: { type: EmailSenderReviewStatusEnum },
    messageCount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "How many messages from this sender have been withheld",
      resolve: ({ message_count }) => message_count,
    },
    crmContactID: {
      type: GraphQLString,
      description: "Set once the review is approved",
      resolve: ({ crm_contact_id }) => crm_contact_id,
    },
    decidedByID: {
      type: GraphQLString,
      description: "The user who approved or skipped the review",
      resolve: ({ decided_by_id }) => decided_by_id,
    },
    decidedAt: date(),
    firstSeenAt: date(),
    lastSeenAt: date(),
  }),
})

export const EmailSenderReviewConnectionType = connectionWithCursorInfo({
  name: "EmailSenderReview",
  nodeType: EmailSenderReviewType,
}).connectionType

export const emailSenderReview: GraphQLFieldConfig<any, ResolverContext> = {
  type: EmailSenderReviewType,
  description: "A pending, approved or skipped email sender review",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the review",
    },
  },
  resolve: async (_root, { id }, { emailSenderReviewLoader }) => {
    if (!emailSenderReviewLoader) return null
    return emailSenderReviewLoader(id)
  },
}

export const emailSenderReviewsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: EmailSenderReviewConnectionType,
  description: "A connection of a partner's email sender reviews",
  args: pageable({
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to list sender reviews for",
    },
    status: {
      type: EmailSenderReviewStatusEnum,
      description: "Only reviews with this status. Defaults to all statuses.",
    },
  }),
  resolve: async (_root, args, { emailSenderReviewsLoader }) => {
    if (!emailSenderReviewsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Gravity rejects empty params, so leave out optional ones that are unset or null
    const { body, headers } = await emailSenderReviewsLoader(
      omitBy(
        {
          partner_id: args.partnerID,
          status: args.status,
          total_count: true,
          size,
          offset,
        },
        isNil
      )
    )

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}
