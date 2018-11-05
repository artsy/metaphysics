import { GraphQLEnumType } from "graphql"

const PartnerShowSorts = {
  type: new GraphQLEnumType({
    name: "PartnerShowSorts",
    values: {
      created_at_asc: {
        deprecationReason: "use capital enums",
        value: "created_at",
      },
      created_at_desc: {
        deprecationReason: "use capital enums",
        value: "-created_at",
      },
      end_at_asc: {
        deprecationReason: "use capital enums",
        value: "end_at",
      },
      end_at_desc: {
        deprecationReason: "use capital enums",
        value: "-end_at",
      },
      name_asc: {
        deprecationReason: "use capital enums",
        value: "name",
      },
      name_desc: {
        deprecationReason: "use capital enums",
        value: "-name",
      },
      publish_at_asc: {
        deprecationReason: "use capital enums",
        value: "publish_at",
      },
      publish_at_desc: {
        deprecationReason: "use capital enums",
        value: "-publish_at",
      },
      start_at_asc: {
        deprecationReason: "use capital enums",
        value: "start_at",
      },
      start_at_desc: {
        deprecationReason: "use capital enums",
        value: "-start_at",
      },
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
    },
  }),
}

export default PartnerShowSorts
