import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
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

export const CRMActivityKindEnum = new GraphQLEnumType({
  name: "CRMActivityKind",
  values: {
    EMAIL: { value: "email" },
    NOTE: { value: "note" },
  },
})

export const CRMActivitySortEnum = new GraphQLEnumType({
  name: "CRMActivitySort",
  values: {
    OCCURRED_AT_ASC: { value: "occurred_at" },
    OCCURRED_AT_DESC: { value: "-occurred_at" },
  },
})

export const EmailParticipantRoleEnum = new GraphQLEnumType({
  name: "EmailParticipantRole",
  values: {
    FROM: { value: "from" },
    TO: { value: "to" },
    CC: { value: "cc" },
    BCC: { value: "bcc" },
  },
})

export const EmailMessageDirectionEnum = new GraphQLEnumType({
  name: "EmailMessageDirection",
  values: {
    INBOUND: { value: "inbound" },
    OUTBOUND: { value: "outbound" },
  },
})

export const EmailParticipantType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "EmailParticipant",
    fields: () => ({
      ...InternalIDFields,
      role: { type: EmailParticipantRoleEnum },
      address: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: GraphQLString },
      crmContactID: {
        type: GraphQLString,
        description: "Set when the address belongs to a CRM contact",
        resolve: ({ crm_contact_id }) => crm_contact_id,
      },
    }),
  }
)

export const EmailMessageType = new GraphQLObjectType<any, ResolverContext>({
  name: "EmailMessage",
  fields: () => ({
    ...InternalIDFields,
    direction: { type: EmailMessageDirectionEnum },
    fromAddress: {
      type: GraphQLString,
      resolve: ({ from_address }) => from_address,
    },
    fromName: {
      type: GraphQLString,
      resolve: ({ from_name }) => from_name,
    },
    sentAt: date(),
    receivedAt: date(),
    hasAttachments: {
      type: GraphQLBoolean,
      resolve: ({ has_attachments }) => has_attachments,
    },
    contentVisible: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "Whether the viewer may read the subject and snippet. True for the mailbox owner, and for colleagues once the owner shares content with the partner.",
      resolve: ({ content_visible }) => !!content_visible,
    },
    subject: {
      type: GraphQLString,
      description: "Null unless `contentVisible` is true",
    },
    snippet: {
      type: GraphQLString,
      description: "Null unless `contentVisible` is true",
    },
    participants: {
      type: new GraphQLList(new GraphQLNonNull(EmailParticipantType)),
      description:
        "Bcc participants are only included when the viewer may read the message",
      resolve: ({ participants }) => participants ?? [],
    },
  }),
})

export const CRMActivityType = new GraphQLObjectType<any, ResolverContext>({
  name: "CRMActivity",
  fields: () => ({
    ...InternalIDFields,
    crmContactID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ crm_contact_id }) => crm_contact_id,
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    kind: { type: CRMActivityKindEnum },
    occurredAt: date(),
    createdAt: date(),
    emailMessage: {
      type: EmailMessageType,
      description: "Null for activities that are not emails",
      resolve: ({ email_message }) => email_message ?? null,
    },
  }),
})

export const CRMActivityConnectionType = connectionWithCursorInfo({
  name: "CRMActivity",
  nodeType: CRMActivityType,
}).connectionType

export const crmActivitiesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: CRMActivityConnectionType,
  description: "A connection of the timeline activities of a CRM contact",
  args: pageable({
    crmContactID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the CRM contact",
    },
    kind: {
      type: CRMActivityKindEnum,
      description: "Only activities of this kind",
    },
    sort: {
      type: CRMActivitySortEnum,
      description: "Defaults to OCCURRED_AT_DESC (newest first)",
    },
  }),
  // Gravity embeds each email message and its participants in the page, so
  // no per-node loader calls are needed.
  resolve: async (_root, args, { crmActivitiesLoader }) => {
    if (!crmActivitiesLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Gravity rejects empty params, so leave out optional ones that are unset or null
    const { body, headers } = await crmActivitiesLoader(
      omitBy(
        {
          crm_contact_id: args.crmContactID,
          kind: args.kind,
          sort: args.sort,
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
