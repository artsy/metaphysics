import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"

export const AssetType = new GraphQLObjectType<any, ResolverContext>({
  name: "Asset",
  description: "An asset which is assigned to a consignment submission",
  fields: {
    ...InternalIDFields,
    submissionID: {
      description: "The convection submission ID",
      type: GraphQLString,
      resolve: ({ submission_id }) => submission_id,
    },
    geminiToken: {
      description: "The gemini token for the asset",
      type: GraphQLString,
      resolve: ({ gemini_token }) => gemini_token,
    },
    assetType: {
      description: "The type of the asset",
      type: GraphQLString,
      resolve: ({ asset_type }) => asset_type,
    },
  },
})

// There is no need to support reading yet,
// and so this file has no default export
// to handle resolving.
