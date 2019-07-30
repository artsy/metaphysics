import { GraphQLEnumType } from "graphql"

const PartnerCategoryTypeEnum = {
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
