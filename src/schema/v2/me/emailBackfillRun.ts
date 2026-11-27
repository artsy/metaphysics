import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"

export const EmailBackfillRunStatusEnum = new GraphQLEnumType({
  name: "EmailBackfillRunStatus",
  values: {
    COMPLETED: { value: "completed" },
    FAILED: { value: "failed" },
    PROCESSING: { value: "processing" },
  },
})

export const EmailBackfillRunType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "EmailBackfillRun",
    description:
      "A backfill of an email account’s mail from a date chosen by the user",
    fields: () => ({
      ...InternalIDFields,
      backfillSince: date(),
      backfillUntil: date(),
      capped: {
        type: GraphQLBoolean,
        description:
          "Whether the run stopped at the message limit, leaving the oldest mail out",
      },
      completedAt: date(),
      createdAt: date(),
      emailAccountId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ email_account_id }) => email_account_id,
      },
      lastError: {
        type: GraphQLString,
        resolve: ({ last_error }) => last_error,
      },
      queuedMessages: {
        type: GraphQLInt,
        description: "The number of messages queued for ingestion",
        resolve: ({ queued_messages }) => queued_messages,
      },
      requestedById: {
        type: GraphQLString,
        resolve: ({ requested_by_id }) => requested_by_id,
      },
      status: { type: EmailBackfillRunStatusEnum },
      updatedAt: date(),
    }),
  }
)

export const emailBackfillRun: GraphQLFieldConfig<any, ResolverContext> = {
  type: EmailBackfillRunType,
  description:
    "The most recent backfill requested for an email account, or null if none was requested",
  args: {
    emailAccountId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email account",
    },
  },
  resolve: async (_root, { emailAccountId }, { emailBackfillRunLoader }) => {
    if (!emailBackfillRunLoader) return null

    try {
      return await emailBackfillRunLoader(emailAccountId)
    } catch (error) {
      // Gravity responds 404 when no backfill was ever requested
      if ((error as any)?.statusCode === 404) return null
      throw error
    }
  },
}
