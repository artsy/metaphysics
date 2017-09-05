import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"

export const AssetType = new GraphQLObjectType({
  name: "Asset",
  description: "An asset which is assigned to a consignment submission",
  fields: {
    id: {
      description: "Convection id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    submission_id: {
      description: "The convection submission ID",
      type: GraphQLString,
    },
    impulse_token: {
      description: "The impulse token for the asset",
      type: GraphQLString,
    },
  },
})

// There is no need to support reading yet,
// and so this file has no default export
// to handle resolving.
