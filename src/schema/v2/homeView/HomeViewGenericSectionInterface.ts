import { GraphQLInterfaceType } from "graphql"
import { HomeViewSectionTypeNames } from "./sectionTypes/names"
import { standardSectionFields } from "./sectionTypes/standardSectionFields"

export const HomeViewGenericSectionInterface = new GraphQLInterfaceType({
  name: HomeViewSectionTypeNames.HomeViewSectionGeneric,
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
  resolveType: (value) => {
    return value.type
  },
})
