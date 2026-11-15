import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLFloat,
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
import { CRMContactEmailType } from "./crmContactEmail"
import { CRMContactLocationType } from "./crmContactLocation"

export const CRMContactTypeEnum = new GraphQLEnumType({
  name: "CRMContactType",
  values: {
    PERSON: { value: "person" },
    ORGANIZATION: { value: "organization" },
  },
})

export const CRMContactStatusEnum = new GraphQLEnumType({
  name: "CRMContactStatus",
  values: {
    ACTIVE: { value: "active" },
    ARCHIVED: { value: "archived" },
  },
})

export const CRMContactSortEnum = new GraphQLEnumType({
  name: "CRMContactSort",
  values: {
    DISPLAY_NAME_ASC: { value: "display_name" },
    DISPLAY_NAME_DESC: { value: "-display_name" },
  },
})

// A CRM contact is a person or organization a gallery deals with. It is not
// the same thing as `PartnerContact`, the gallery's own contact info.
export const CRMContactType = new GraphQLObjectType<any, ResolverContext>({
  name: "CRMContact",
  fields: () => ({
    ...InternalIDFields,
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    assignedToUserID: {
      type: GraphQLString,
      description: "The partner user this contact is assigned to",
      resolve: ({ assigned_to_user_id }) => assigned_to_user_id,
    },
    contactType: {
      type: CRMContactTypeEnum,
      resolve: ({ contact_type }) => contact_type,
    },
    firstName: {
      type: GraphQLString,
      resolve: ({ first_name }) => first_name,
    },
    lastName: {
      type: GraphQLString,
      resolve: ({ last_name }) => last_name,
    },
    company: { type: GraphQLString },
    displayName: {
      type: GraphQLString,
      description: "Computed by Gravity from the name, company or email",
      resolve: ({ display_name }) => display_name,
    },
    phone: {
      type: GraphQLString,
      description: "The phone number, as entered",
    },
    normalizedPhone: {
      type: GraphQLString,
      description:
        "The phone number in E.164 format. Null unless the number was entered with a `+` or `00` prefix.",
      resolve: ({ normalized_phone }) => normalized_phone,
    },
    status: { type: CRMContactStatusEnum },
    archivedAt: date(),
    categories: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Any of collector, artist, enthusiast, advisor, critic, curator, journalist, gallery, institution, museum, buyer, government",
    },
    notes: { type: GraphQLString },
    budgetMin: {
      type: GraphQLFloat,
      description: "Lower end of the contact's budget, in `budgetCurrency`",
      resolve: ({ budget_min }) => (isNil(budget_min) ? null : +budget_min),
    },
    budgetMax: {
      type: GraphQLFloat,
      description: "Upper end of the contact's budget, in `budgetCurrency`",
      resolve: ({ budget_max }) => (isNil(budget_max) ? null : +budget_max),
    },
    budgetCurrency: {
      type: GraphQLString,
      description: "ISO 4217 currency code of the budget, e.g. USD",
      resolve: ({ budget_currency }) => budget_currency,
    },
    // Gravity embeds these in every contact response, so they cost no extra
    // loader calls on a list. Use the dedicated connections to page them.
    emails: {
      type: new GraphQLList(new GraphQLNonNull(CRMContactEmailType)),
      resolve: ({ emails }) => emails ?? [],
    },
    locations: {
      type: new GraphQLList(new GraphQLNonNull(CRMContactLocationType)),
      resolve: ({ locations }) => locations ?? [],
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const CRMContactConnectionType = connectionWithCursorInfo({
  name: "CRMContact",
  nodeType: CRMContactType,
}).connectionType

export const crmContact: GraphQLFieldConfig<any, ResolverContext> = {
  type: CRMContactType,
  description: "A CRM contact of a partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the contact",
    },
  },
  resolve: async (_root, { id }, { crmContactLoader }) => {
    if (!crmContactLoader) return null
    return crmContactLoader(id)
  },
}

export const crmContactsConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: CRMContactConnectionType,
  description: "A connection of CRM contacts for a partner",
  args: pageable({
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to list contacts for",
    },
    status: {
      type: CRMContactStatusEnum,
      description:
        "Defaults to ACTIVE. There is no way to list both statuses in one request.",
    },
    category: {
      type: GraphQLString,
      description:
        "Only contacts with this category. Case-insensitive, one value only.",
    },
    query: {
      type: GraphQLString,
      description:
        "Case-insensitive substring match on the display name or any email address",
    },
    assignedToUserID: {
      type: GraphQLString,
      description:
        "Only contacts assigned to this partner user. Cannot be combined with isUnassigned.",
    },
    isUnassigned: {
      type: GraphQLBoolean,
      description:
        "Only contacts with no assignee. Cannot be combined with assignedToUserID.",
    },
    sort: {
      type: CRMContactSortEnum,
      description: "Defaults to DISPLAY_NAME_ASC",
    },
  }),
  resolve: async (_root, args, { crmContactsLoader }) => {
    if (!crmContactsLoader) return null

    if (args.assignedToUserID && args.isUnassigned) {
      throw new GraphQLError(
        "assignedToUserID and isUnassigned cannot be combined"
      )
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Gravity rejects empty params, so leave out optional ones that are unset or null
    const { body, headers } = await crmContactsLoader(
      omitBy(
        {
          partner_id: args.partnerID,
          status: args.status,
          category: args.category,
          q: args.query,
          assigned_to_user_id: args.assignedToUserID,
          unassigned: args.isUnassigned || undefined,
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
