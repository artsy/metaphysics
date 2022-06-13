import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const S3PolicyConditionsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "S3PolicyConditionsType",
  description: "The conditions for uploading assets to media.artsy.net",
  fields: {
    bucket: {
      description: "The bucket to upload to.",
      type: new GraphQLNonNull(GraphQLString),
    },
    acl: {
      description: "The assigned access control",
      type: new GraphQLNonNull(GraphQLString),
    },
    geminiKey: {
      description: "A key which is prefixed on your file",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ gemini_key }) => gemini_key,
    },
    successActionStatus: {
      description: "The returned status code, currently always 201",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ success_action_status }) => success_action_status,
    },
  },
})

export const S3PolicyDocumentType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "S3PolicyDocumentType",
    description: "An policy for uploading assets to media.artsy.net",
    fields: {
      expiration: {
        description: "An expiration date string.",
        type: new GraphQLNonNull(GraphQLString),
      },
      conditions: {
        description: "The details for the upload",
        type: new GraphQLNonNull(S3PolicyConditionsType),
        resolve: ({ conditions }) => {
          return {
            bucket: conditions[0].bucket,
            acl: conditions[2].acl,
            success_action_status: conditions[3].success_action_status,
            gemini_key: conditions[1][2],
          }
        },
      },
    },
  }
)

export const CredentialsType = new GraphQLObjectType<any, ResolverContext>({
  name: "Credentials",
  description: "An asset which is assigned to a consignment submission",
  fields: {
    credentials: {
      description: "The key to use with S3.",
      type: new GraphQLNonNull(GraphQLString),
    },
    policyEncoded: {
      description: "A base64 encoded version of the S3 policy",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ policy_encoded }) => policy_encoded,
    },
    policyDocument: {
      description: "The s3 policy document for your request",
      type: new GraphQLNonNull(S3PolicyDocumentType),
      resolve: ({ policy_document }) => policy_document,
    },
    signature: {
      description: "The signature for your asset.",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export default mutationWithClientMutationId<any, any, ResolverContext>({
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
      resolve: (asset) => asset.body,
    },
  },
  mutateAndGetPayload: ({ name, acl }, { createNewGeminiAssetLoader }) => {
    if (!createNewGeminiAssetLoader) return null
    return createNewGeminiAssetLoader({ name, acl })()
  },
})
