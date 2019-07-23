import { GraphQLEnumType } from "graphql"
import { deprecate } from "lib/deprecation"

const ArtworkSorts = {
  type: new GraphQLEnumType({
    name: "ArtworkSorts",
    values: {
      availability_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "AVAILABILITY_DESC",
        }),
        value: "-availability",
      },
      created_at_asc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "CREATED_AT_ASC",
        }),
        value: "created_at",
      },
      created_at_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "CREATED_AT_DESC",
        }),
        value: "-created_at",
      },
      deleted_at_asc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "DELETED_AT_ASC",
        }),
        value: "deleted_at",
      },
      deleted_at_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "DELETED_AT_DESC",
        }),
        value: "-deleted_at",
      },
      iconicity_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "ICONICITY_DESC",
        }),
        value: "-iconicity",
      },
      merchandisability_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "MERCHANDISABILITY_DESC",
        }),
        value: "-merchandisability",
      },
      published_at_asc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "PUBLISHED_AT_ASC",
        }),
        value: "published_at",
      },
      published_at_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "PUBLISHED_AT_DESC",
        }),
        value: "-published_at",
      },
      partner_updated_at_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "PARTNER_UPDATED_AT_DESC",
        }),
        value: "-partner_updated_at",
      },
      title_asc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "TITLE_ASC",
        }),
        value: "title",
      },
      title_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "TITLE_DESC",
        }),
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
