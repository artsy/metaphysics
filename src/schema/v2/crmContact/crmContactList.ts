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

export const CRMContactListSortEnum = new GraphQLEnumType({
  name: "CRMContactListSort",
  values: {
    UPDATED_AT_DESC: { value: "-updated_at" },
    UPDATED_AT_ASC: { value: "updated_at" },
    CREATED_AT_DESC: { value: "-created_at" },
    CREATED_AT_ASC: { value: "created_at" },
    NAME_ASC: { value: "name" },
    NAME_DESC: { value: "-name" },
  },
})

// A named group of a partner's CRM contacts, shown as a "segment" of the
// Clients list in ArtOS. Contacts are added and removed by hand.
export const CRMContactListType = new GraphQLObjectType<any, ResolverContext>({
  name: "CRMContactList",
  fields: () => ({
    ...InternalIDFields,
    partnerID: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    contactsCount: {
      type: GraphQLInt,
      description:
        "Number of active contacts in the list. Null on lists embedded in a contact.",
      resolve: ({ contacts_count }) => contacts_count,
    },
    createdByID: {
      type: GraphQLString,
      resolve: ({ created_by_id }) => created_by_id,
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const CRMContactListConnectionType = connectionWithCursorInfo({
  name: "CRMContactList",
  nodeType: CRMContactListType,
}).connectionType

export const crmContactList: GraphQLFieldConfig<any, ResolverContext> = {
  type: CRMContactListType,
  description: "A CRM contact list of a partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
  },
  resolve: async (_root, { id }, { crmContactListLoader }) => {
    if (!crmContactListLoader) return null
    return crmContactListLoader(id)
  },
}

export const crmContactListsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: CRMContactListConnectionType,
  description: "A connection of CRM contact lists for a partner",
  args: pageable({
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to list contact lists for",
    },
    sort: {
      type: CRMContactListSortEnum,
      description: "Defaults to UPDATED_AT_DESC",
    },
  }),
  resolve: async (_root, args, { crmContactListsLoader }) => {
    if (!crmContactListsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await crmContactListsLoader(
      omitBy(
        {
          partner_id: args.partnerID,
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
