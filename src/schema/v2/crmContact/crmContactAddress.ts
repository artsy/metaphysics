import {
  GraphQLEnumType,
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

export const CRMContactAddressTypeEnum = new GraphQLEnumType({
  name: "CRMContactAddressType",
  description: "A contact has at most one address of each type",
  values: {
    SHIPPING: { value: "shipping" },
    BILLING: { value: "billing" },
    HOME: { value: "home" },
    OTHER: { value: "other" },
  },
})

export const CRMContactAddressType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CRMContactAddress",
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
    addressType: {
      type: new GraphQLNonNull(CRMContactAddressTypeEnum),
      resolve: ({ address_type }) => address_type,
    },
    addressLine1: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ address_line_1 }) => address_line_1,
    },
    addressLine2: {
      type: GraphQLString,
      resolve: ({ address_line_2 }) => address_line_2,
    },
    city: {
      type: new GraphQLNonNull(GraphQLString),
    },
    region: {
      type: GraphQLString,
      description: "State or region",
    },
    postalCode: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ postal_code }) => postal_code,
    },
    country: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ISO 3166-1 alpha-2 country code, uppercase",
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const CRMContactAddressConnectionType = connectionWithCursorInfo({
  name: "CRMContactAddress",
  nodeType: CRMContactAddressType,
}).connectionType

export const crmContactAddress: GraphQLFieldConfig<any, ResolverContext> = {
  type: CRMContactAddressType,
  description: "An address of a CRM contact",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the address",
    },
  },
  resolve: async (_root, { id }, { crmContactAddressLoader }) => {
    if (!crmContactAddressLoader) return null
    return crmContactAddressLoader(id)
  },
}

export const crmContactAddressesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: CRMContactAddressConnectionType,
  description: "A connection of the addresses of a CRM contact",
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
  resolve: async (_root, args, { crmContactAddressesLoader }) => {
    if (!crmContactAddressesLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await crmContactAddressesLoader({
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
