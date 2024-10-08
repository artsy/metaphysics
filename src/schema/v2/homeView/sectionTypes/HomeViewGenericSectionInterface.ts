import { GraphQLInterfaceType } from "graphql"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./standardSectionFields"

export const HomeViewGenericSectionInterface = new GraphQLInterfaceType({
  name: HomeViewSectionTypeNames.HomeViewSectionGeneric,
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
  resolveType: (value) => {
    return value.type
  },
})
