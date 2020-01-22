import { GraphQLEnumType } from "graphql"

const ArtworkSorts = {
  type: new GraphQLEnumType({
    name: "ArtworkSorts",
    values: {
      AVAILABILITY_ASC: {
        value: "availability",
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
