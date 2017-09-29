// @ts-check

import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

export const CredentialsType = new GraphQLObjectType({
  name: "Credentials",
  description: "An asset which is assigned to a consignment submission",
  fields: {
    credentials: {
      description: "The key to use with S3.",
      type: new GraphQLNonNull(GraphQLString),
    },
    policy_encoded: {
      description: "The convection submission ID",
      type: new GraphQLNonNull(GraphQLString),
    },
    // Intentionally left out policy_document, as not needed for now
    signature: {
      description: "The signature for your asset.",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export default mutationWithClientMutationId({
  name: "RequestCredentialsForAssetUpload",
  description: "Attach an gemini asset to a consignment submission",
  inputFields: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the bucket",
    },
    acl: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The desired access control",
    },
  },
  outputFields: {
    asset: {
      type: CredentialsType,
      resolve: credentials => credentials,
    },
  },
  mutateAndGetPayload: ({ name, acl }, request, { rootValue: { createNewGeminiAssetLoader } }) => {
    if (!createNewGeminiAssetLoader) return null
    return createNewGeminiAssetLoader({ name, acl })
  },
})
