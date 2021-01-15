import { GraphQLInputObjectType, GraphQLNonNull, GraphQLFloat } from "graphql"

const Near = new GraphQLInputObjectType({
  name: "Near",
  fields: {
    lat: { type: new GraphQLNonNull(GraphQLFloat) },
    lng: { type: new GraphQLNonNull(GraphQLFloat) },
    maxDistance: { type: GraphQLFloat },
  },
})

export type TNear = {
  lat: number
  lng: number
  maxDistance?: number
}

export default Near
