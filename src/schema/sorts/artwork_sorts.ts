import { GraphQLEnumType } from "graphql"

const ArtworkSorts = {
  type: new GraphQLEnumType({
    name: "ArtworkSorts",
    values: {
      availability_desc: {
        deprecationReason: "use capital enums",
        value: "-availability",
      },
      created_at_asc: {
        deprecationReason: "use capital enums",
        value: "created_at",
      },
      created_at_desc: {
        deprecationReason: "use capital enums",
        value: "-created_at",
      },
      deleted_at_asc: {
        deprecationReason: "use capital enums",
        value: "deleted_at",
      },
      deleted_at_desc: {
        deprecationReason: "use capital enums",
        value: "-deleted_at",
      },
      iconicity_desc: {
        deprecationReason: "use capital enums",
        value: "-iconicity",
      },
      merchandisability_desc: {
        deprecationReason: "use capital enums",
        value: "-merchandisability",
      },
      published_at_asc: {
        deprecationReason: "use capital enums",
        value: "published_at",
      },
      published_at_desc: {
        deprecationReason: "use capital enums",
        value: "-published_at",
      },
      partner_updated_at_desc: {
        deprecationReason: "use capital enums",
        value: "-partner_updated_at",
      },
      title_asc: {
        deprecationReason: "use capital enums",
        value: "title",
      },
      title_desc: {
        deprecationReason: "use capital enums",
        value: "-title",
      },
      AVAILABILITY_DESC: {
        value: "-availability",
      },
      CREATED_AT_ASC: {
        value: "created_at",
      },
      CREATED_AT_DESC: {
        value: "-created_at",
      },
      DELETED_AT_ASC: {
        value: "deleted_at",
      },
      DELETED_AT_DESC: {
        value: "-deleted_at",
      },
      ICONICITY_DESC: {
        value: "-iconicity",
      },
      MERCHANDISABILITY_DESC: {
        value: "-merchandisability",
      },
      PARTNER_UPDATED_AT_DESC: {
        value: "-partner_updated_at",
      },
      PUBLISHED_AT_ASC: {
        value: "published_at",
      },
      PUBLISHED_AT_DESC: {
        value: "-published_at",
      },
      TITLE_ASC: {
        value: "title",
      },
      TITLE_DESC: {
        value: "-title",
      },
    },
  }),
}

export default ArtworkSorts
