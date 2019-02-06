import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import GraphQLJSON from "graphql-type-json"

export const GeminiEntryType = new GraphQLObjectType<ResolverContext>({
  name: "GeminiEntry",
  description: "An entry from gemini",
  fields: {
    token: {
      description: "The token that represents the gemini entry.",
      type: new GraphQLNonNull(GraphQLString),
    },
    // TODO: skipping image_urls due to not needing them right now
    // https://github.com/artsy/gemini/blob/master/app/models/entry_version.rb
  },
})

export default mutationWithClientMutationId({
  name: "CreateGeminiEntryForAsset",
  description: "Attach an gemini asset to a consignment submission",
  inputFields: {
    source_key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The path to the file",
    },
    template_key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The template key, this is `name` in the asset request",
    },
    source_bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The S3 bucket where the file was uploaded",
    },
    metadata: {
      type: new GraphQLNonNull(GraphQLJSON),
      description:
        "Additional JSON data to pass through gemini, should deiinitely contain an `id` and a `_type`",
    },
  },
  outputFields: {
    asset: {
      type: GeminiEntryType,
      resolve: credentials => credentials,
    },
  },
  mutateAndGetPayload: (
    { name, template_key, source_key, source_bucket, metadata },
    _request,
    { rootValue: { createNewGeminiEntryAssetLoader } }
  ) => {
    if (!createNewGeminiEntryAssetLoader) return null
    return createNewGeminiEntryAssetLoader({
      name,
      template_key,
      source_key,
      source_bucket,
      metadata,
    })
  },
})
