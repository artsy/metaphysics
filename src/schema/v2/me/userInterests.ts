import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"
import { GeneType } from "../gene"
import { IDFields } from "../object_identification"

interface UserInterest {
  body?: string
  category: "collected_before" | "interested_in_collecting"
  created_at: string
  id: number
  interest: unknown // Artist | Gene
  owner: unknown // CollectorProfile | UserSaleProfile
  updated_at: string
}

const userInterestCategoryEnum = new GraphQLEnumType({
  name: "UserInterestCategory",
  values: {
    COLLECTED_BEFORE: { value: "collected_before" },
    INTERESTED_IN_COLLECTING: { value: "interested_in_collecting" },
  },
})

const userInterestInterestUnion = new GraphQLUnionType({
  name: "UserInterestInterest",
  types: [ArtistType, GeneType],
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
  },
})
