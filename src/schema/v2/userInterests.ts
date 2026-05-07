import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  Thunk,
} from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "./artist"
import { GeneType } from "./gene"
import { IDFields } from "./object_identification"

export type UserInterestCategory =
  | "collected_before"
  | "interested_in_collecting"

export type UserInterestOwnerType = "CollectorProfile" | "UserSaleProfile"

export type UserInterestInterestType = "Artist" | "Gene"

export interface UserInterest {
  body?: string
  category: UserInterestCategory
  created_at: string
  id: number
  interest: unknown // object which is one of Artist | Gene
  owner: unknown // object which is one of CollectorProfile | UserSaleProfile
  owner_type: UserInterestOwnerType
  updated_at: string
}

export const userInterestInterestTypeEnum = new GraphQLEnumType({
  name: "UserInterestInterestType",
  values: {
    ARTIST: { value: "Artist" },
    GENE: { value: "Gene" },
  },
})

export const userInterestCategoryEnum = new GraphQLEnumType({
  name: "UserInterestCategory",
  values: {
    COLLECTED_BEFORE: { value: "collected_before" },
    INTERESTED_IN_COLLECTING: { value: "interested_in_collecting" },
  },
})

export const userInterestOwnerTypeEnum = new GraphQLEnumType({
  name: "UserInterestOwnerType",
  values: {
    COLLECTOR_PROFILE: { value: "CollectorProfile" },
    USER_SALE_PROFILE: { value: "UserSaleProfile" },
  },
})

export const userInterestInterestUnion = new GraphQLUnionType({
  name: "UserInterestInterest",
  types: () => [ArtistType, GeneType],
  resolveType: (object) => ("birthday" in object ? ArtistType : GeneType),
})

export const userInterestType = new GraphQLObjectType<
  UserInterest,
  ResolverContext
>({
  name: "UserInterest",
  fields: {
    ...IDFields,
    body: { type: GraphQLString },
    category: { type: new GraphQLNonNull(userInterestCategoryEnum) },
    interest: { type: new GraphQLNonNull(userInterestInterestUnion) },
    ownerType: {
      type: userInterestOwnerTypeEnum,
      resolve: ({ owner_type }) => owner_type,
    },
    private: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})

export const userInterestFields: Thunk<GraphQLFieldConfigMap<
  UserInterest,
  ResolverContext
>> = () => ({
  ...IDFields,
  body: { type: GraphQLString },
  category: { type: new GraphQLNonNull(userInterestCategoryEnum) },
  createdByAdmin: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: ({ owner_type }) => owner_type === "UserSaleProfile",
  },
  ownerType: {
    type: GraphQLString,
  },
  private: {
    type: new GraphQLNonNull(GraphQLBoolean),
  },
})

export const {
  connectionType: UserInterestConnection,
  edgeType: UserInterestEdge,
} = connectionWithCursorInfo({
  name: "UserInterest",
  nodeType: userInterestInterestUnion,
  edgeFields: userInterestFields,
  resolveNode: (node) => node.interest,
})
