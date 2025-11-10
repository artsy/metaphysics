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
      LAST_OFFERABLE_ACTIVITY_AT_DESC: {
        value: "-last_offerable_activity_at",
      },
      LAST_SAVED_AT_DESC: {
        value: "-last_saved_at",
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
      RECENT_SAVES_COUNT_DESC: {
        value: "-recent_saves_count",
      },
      TITLE_ASC: {
        value: "title",
      },
      TITLE_DESC: {
        value: "-title",
      },
      COMPLETENESS_SCORE_ASC: {
        value: "completeness_score",
      },
      COMPLETENESS_SCORE_DESC: {
        value: "-completeness_score",
      },
    },
  }),
}

export default ArtworkSorts
