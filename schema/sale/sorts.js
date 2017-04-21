import { GraphQLEnumType } from "graphql"

export default {
  type: new GraphQLEnumType({
    name: "SaleSorts",
    values: {
      _ID_ASC: {
        value: "_id",
      },
      _ID_DESC: {
        value: "-_id",
      },
      CREATED_AT_ASC: {
        value: "created_at",
      },
      CREATED_AT_DESC: {
        value: "-created_at",
      },
      ELIGIBLE_SALE_ARTWORKS_COUNT_ASC: {
        value: "eligible_sale_artworks_count",
      },
      ELIGIBLE_SALE_ARTWORKS_COUNT_DESC: {
        value: "-eligible_sale_artworks_count",
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
      START_AT_ASC: {
        value: "start_at",
      },
      START_AT_DESC: {
        value: "-start_at",
      },
      TIMELY_AT_NAME_ASC: {
        value: "timely_at,name",
      },
      TIMELY_AT_NAME_DESC: {
        value: "-timely_at,name",
      },
    },
  }),
}
