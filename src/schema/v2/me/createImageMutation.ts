import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const CreateImagePayloadImageType = new GraphQLObjectType({
  name: "CreateImagePayloadImage",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    height: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
    width: {
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width,
    },
    imageURL: {
      type: GraphQLString,
      resolve: ({ image_url }) => image_url,
    },
  },
})

export const createImageMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateImage",
  description:
    "Creates a standalone image and queues it for processing via Gemini.",
  inputFields: {
    src: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The S3 url for the image to be processed.",
    },
    templateKey: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The Gemini template key that tells us which image versions we want to generate during processing.",
    },
  },
  outputFields: {
    image: {
      type: CreateImagePayloadImageType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createImageLoader }) => {
    if (!createImageLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return await createImageLoader({
      src: args.src,
      template_key: args.templateKey,
    })
  },
})
