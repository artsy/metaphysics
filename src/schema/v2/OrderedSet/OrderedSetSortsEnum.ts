import { GraphQLEnumType } from "graphql"

export const ORDERED_SET_SORTS = {
  ID_ASC: { value: "_id" },
  ID_DESC: { value: "-_id" },
  KEY_ASC: { value: "key" },
  KEY_DESC: { value: "-key" },
  CREATED_AT_ASC: { value: "created_at" },
  CREATED_AT_DESC: { value: "-created_at" },
  OWNER_TYPE_ASC: { value: "owner_type" },
  OWNER_TYPE_DESC: { value: "-owner_type" },
  OWNER_ID_ASC: { value: "owner_id" },
  OWNER_ID_DESC: { value: "-owner_id" },
  ITEM_TYPE_ASC: { value: "item_type" },
  ITEM_TYPE_DESC: { value: "-item_type" },
  NAME_ASC: { value: "name" },
  NAME_DESC: { value: "-name" },
  INTERNAL_NAME_ASC: { value: "internal_name" },
  INTERNAL_NAME_DESC: { value: "-internal_name" },
} as const

export const OrderedSetSortsEnum = new GraphQLEnumType({
  name: "OrderedSetSorts",
  values: ORDERED_SET_SORTS,
})
