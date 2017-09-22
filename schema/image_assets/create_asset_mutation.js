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
    // policy_document: {
    //   description: "The convection submission ID",
    //   type: GraphQLString,
    // },
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
  },
  outputFields: {
    asset: {
      type: CredentialsType,
      resolve: response => response,
    },
  },
  mutateAndGetPayload: ({ name }, request, { rootValue: { createImageUploadLoader } }) => {
    if (!createImageUploadLoader) return null
    return createImageUploadLoader(name, {})
  },
})
