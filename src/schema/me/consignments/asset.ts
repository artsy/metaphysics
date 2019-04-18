import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

export const AssetType = new GraphQLObjectType<any, ResolverContext>({
  name: "Asset",
  description: "An asset which is assigned to a consignment submission",
  fields: {
    ...InternalIDFields,
    submission_id: {
      description: "The convection submission ID",
      type: GraphQLString,
    },
    gemini_token: {
      description: "The gemini token for the asset",
      type: GraphQLString,
    },
    asset_type: {
      description: "The type of the asset",
      type: GraphQLString,
    },
  },
})

// There is no need to support reading yet,
// and so this file has no default export
// to handle resolving.
