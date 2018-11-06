import { GraphQLEnumType } from "graphql"

const CategoryType = {
  type: new GraphQLEnumType({
    name: "CategoryType",
    values: {
      GALLERY: {
        value: "Gallery",
      },
      INSTITUTION: {
        value: "Institution",
      },
    },
  }),
}

export default CategoryType
