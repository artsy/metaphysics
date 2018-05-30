// @ts-check

import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { AssetType } from "./asset"

export default mutationWithClientMutationId({
  name: "AddAssetToConsignmentSubmission",
  description: "Attach an gemini asset to a consignment submission",
  inputFields: {
    asset_type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of the asset",
    },
    gemini_token: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The token provided by Gemini for your asset",
    },
    submission_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the submission you want to attach an asset to",
    },
  },
  outputFields: {
    asset: {
      type: AssetType,
      resolve: asset => asset,
    },
  },
  mutateAndGetPayload: (
    assets,
    _request,
    { rootValue: { assetCreateLoader } }
  ) => {
    if (!assetCreateLoader) return null
    return assetCreateLoader(assets)
  },
})
