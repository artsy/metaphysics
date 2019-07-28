import { GraphQLEnumType } from "graphql"

const PartnerShowSorts = {
  type: new GraphQLEnumType({
    name: "PartnerShowSorts",
    values: {
      CREATED_AT_ASC: {
        value: "created_at",
      },
      CREATED_AT_DESC: {
        value: "-created_at",
      },
      END_AT_ASC: {
        value: "end_at",
      },
      END_AT_DESC: {
        value: "-end_at",
      },
      NAME_ASC: {
        value: "name",
      },
      NAME_DESC: {
        value: "-name",
      },
      PUBLISH_AT_ASC: {
        value: "publish_at",
      },
      PUBLISH_AT_DESC: {
        value: "-publish_at",
      },
      START_AT_ASC: {
        value: "start_at",
      },
      START_AT_DESC: {
        value: "-start_at",
      },
      PARTNER_ASC: {
        value: "fully_qualified_name",
      },
    },
  }),
}

export default PartnerShowSorts
