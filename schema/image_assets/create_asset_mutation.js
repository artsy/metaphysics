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
    expiration: {
      description: "The ISO8601 date when the token will expire.",
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
      resolve: credentials => {
        debugger
        return credentials
      },
    },
  },
  mutateAndGetPayload: ({ name, acl }, request, { rootValue: { createNewUploadLoader } }) => {
    if (!createNewUploadLoader) return null
    return createNewUploadLoader({ name, acl })
  },
})
