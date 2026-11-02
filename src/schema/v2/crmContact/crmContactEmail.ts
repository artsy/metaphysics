import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"
import { CRMContactChildSortEnum } from "./crmContactChildSort"

export const CRMContactEmailType = new GraphQLObjectType<any, ResolverContext>({
  name: "CRMContactEmail",
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
    address: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The email address, lowercased and trimmed",
    },
    isPrimary: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether this is the contact's primary email address",
      resolve: ({ is_primary }) => is_primary,
    },
    bouncedAt: date(),
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const CRMContactEmailConnectionType = connectionWithCursorInfo({
  name: "CRMContactEmail",
  nodeType: CRMContactEmailType,
}).connectionType

export const crmContactEmail: GraphQLFieldConfig<any, ResolverContext> = {
  type: CRMContactEmailType,
  description: "An email address of a CRM contact",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email",
    },
  },
  resolve: async (_root, { id }, { crmContactEmailLoader }) => {
    if (!crmContactEmailLoader) return null
    return crmContactEmailLoader(id)
  },
}

export const crmContactEmailsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: CRMContactEmailConnectionType,
  description: "A connection of the email addresses of a CRM contact",
  args: pageable({
    crmContactID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the CRM contact",
    },
    sort: {
      type: CRMContactChildSortEnum,
      description: "Defaults to oldest first",
    },
  }),
  resolve: async (_root, args, { crmContactEmailsLoader }) => {
    if (!crmContactEmailsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await crmContactEmailsLoader({
      crm_contact_id: args.crmContactID,
      sort: args.sort,
      total_count: true,
      size,
      offset,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}
