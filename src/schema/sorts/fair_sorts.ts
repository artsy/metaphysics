import { GraphQLEnumType } from "graphql"

const FairSorts = {
  type: new GraphQLEnumType({
    name: "FairSorts",
    values: {
      CREATED_AT_ASC: {
        value: "created_at",
      },
      CREATED_AT_DESC: {
        value: "-created_at",
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
    },
  }),
}

export default FairSorts
