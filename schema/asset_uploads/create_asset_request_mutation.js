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
      description: "A base64 encoded version of the S3 policy",
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
      description: "The gemini template you want to request",
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
