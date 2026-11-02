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

export const CRMContactLocationType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CRMContactLocation",
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
    countryCode: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ISO 3166-1 alpha-2 country code, uppercase",
      resolve: ({ country_code }) => country_code,
    },
    cityName: {
      type: GraphQLString,
      description: "Null for a country-level location",
      resolve: ({ city_name }) => city_name,
    },
    isPrimary: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether this is the contact's primary location",
      resolve: ({ is_primary }) => is_primary,
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const CRMContactLocationConnectionType = connectionWithCursorInfo({
  name: "CRMContactLocation",
  nodeType: CRMContactLocationType,
}).connectionType

export const crmContactLocation: GraphQLFieldConfig<any, ResolverContext> = {
  type: CRMContactLocationType,
  description: "A location of a CRM contact",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the location",
    },
  },
  resolve: async (_root, { id }, { crmContactLocationLoader }) => {
    if (!crmContactLocationLoader) return null
    return crmContactLocationLoader(id)
  },
}

export const crmContactLocationsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: CRMContactLocationConnectionType,
  description: "A connection of the locations of a CRM contact",
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
  resolve: async (_root, args, { crmContactLocationsLoader }) => {
    if (!crmContactLocationsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await crmContactLocationsLoader({
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
