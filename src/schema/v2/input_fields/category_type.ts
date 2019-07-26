import { GraphQLEnumType } from "graphql"

export const PartnerCategoryTypeEnum = {
  type: new GraphQLEnumType({
    name: "PartnerCategoryType",
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

export default PartnerCategoryTypeEnum
