import { GraphQLString, GraphQLBoolean, GraphQLInt, GraphQLObjectType } from "graphql"

export const timeFields = () => {
  return {
    day: { type: GraphQLInt },
    wday: { type: GraphQLInt },
    month: { type: GraphQLInt },
    year: { type: GraphQLInt },
    hour: { type: GraphQLInt },
    min: { type: GraphQLInt },
    sec: { type: GraphQLInt },
    dst: { type: GraphQLBoolean },
    unix: { type: GraphQLInt },
    utc_offset: { type: GraphQLInt },
    zone: { type: GraphQLString },
    iso8601: { type: GraphQLString },
  }
}

export const TimeType = new GraphQLObjectType({
  name: "Time",
  fields: () => ({
    ...timeFields(),
  }),
})

const Time = {
  type: TimeType,
  description: "Artsy system time, never cached",
  resolve: (root, params, request, { rootValue: { timeLoader } }) => timeLoader(),
}

export default Time
