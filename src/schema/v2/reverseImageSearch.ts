import { ReadStream } from "fs"
import {
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLList,
} from "graphql"
import { GraphQLUpload } from "graphql-upload"
import { tineyeSearch } from "lib/apis/tineye"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "./artwork"

export const ReverseImageSearchResultMatchRect = new GraphQLObjectType({
  name: "ReverseImageSearchResultMatchRect",
  fields: () => ({
    left: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    right: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    top: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    bottom: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  }),
})

export const ReverseImageSearchResult = new GraphQLObjectType({
  name: "ReverseImageSearchResult",
  fields: () => ({
    score: {
      description: "How closely the query image matches the collection image",
      type: new GraphQLNonNull(GraphQLFloat),
    },
    filepath: {
      description: "The matching collection image’s file path",
      type: new GraphQLNonNull(GraphQLString),
    },
    matchPercent: {
      description:
        "How much of the query image’s fingerprint overlaps the collection image’s fingerprint, as a percentage",
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: ({ match_percent }) => match_percent,
    },
    queryOverlapPercent: {
      description:
        "How much of the query image overlaps the collection image, as a percentage",
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: ({ query_overlap_percent }) => query_overlap_percent,
    },
    targetOverlapPercent: {
      description:
        "How much of the collection image overlaps the query image, as a percentage",
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: ({ target_overlap_percent }) => target_overlap_percent,
    },
    targetMatchRect: {
      description: "Location of the matching area in the second image",
      type: new GraphQLNonNull(ReverseImageSearchResultMatchRect),
      resolve: ({ target_match_rect }) => target_match_rect,
    },
    queryMatchRect: {
      description: "Location of the matching area in the first image",
      type: new GraphQLNonNull(ReverseImageSearchResultMatchRect),
      resolve: ({ query_match_rect }) => query_match_rect,
    },
    artwork: {
      type: ArtworkType,
      resolve: (
        { filepath },
        _args,
        { unauthenticatedLoaders: { artworkLoader } }
      ) => {
        if (filepath) {
          const parts = filepath.split("/")
          const artworkId = parts[2]

          return artworkLoader(artworkId)
        }

        return null
      },
    },
  }),
})

export const ReverseImageSearchResults = new GraphQLObjectType({
  name: "ReverseImageSearchResults",
  fields: {
    results: {
      type: new GraphQLNonNull(new GraphQLList(ReverseImageSearchResult)),
    },
  },
})

export const reverseImageSearchResolver = async (_root, args, context) => {
  const { image } = args
  const { meLoader } = context

  if (!meLoader) {
    throw new Error("You need to be signed in to perform this action")
  }

  // Verifying that the token is still valid
  try {
    await meLoader()
  } catch (err) {
    throw new Error("You need to be signed in to perform this action")
  }

  const { filename, mimetype, createReadStream } = await image
  const stream: ReadStream = createReadStream()

  const response = await tineyeSearch({
    image: stream,
    filename,
    contentType: mimetype,
  })

  if (response.status === "ok") {
    return {
      __typename: "ReverseImageSearchResults",
      results: response.result,
    }
  }

  throw new Error(response.error.join("\n"))
}

export const ReverseImageSearch: GraphQLFieldConfig<void, ResolverContext> = {
  type: ReverseImageSearchResults,
  description: "Search for matching artworks by image",
  args: {
    image: {
      description: "Image file",
      // TODO: Remove `as unknown` when "graphql" is updated to version 16.x.x
      // Wrong TS declaration for GraphQLScalarType in node_modules/graphql/type/definition.d.ts
      type: new GraphQLNonNull((GraphQLUpload as unknown) as GraphQLScalarType),
    },
  },
  resolve: reverseImageSearchResolver,
}
