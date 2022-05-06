import { ReadStream } from "fs"
import {
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLList,
} from "graphql"
import { GraphQLUpload } from "graphql-upload"
import { ResolverContext } from "types/graphql"
import { ErrorsType } from "./types/errors"

export const ArtworkImageSearchMatchRect = new GraphQLObjectType({
  name: "ArtworkImageSearchMatchRect",
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
      type: new GraphQLNonNull(ArtworkImageSearchMatchRect),
      resolve: ({ target_match_rect }) => target_match_rect,
    },
    queryMatchRect: {
      description: "Location of the matching area in the first image",
      type: new GraphQLNonNull(ArtworkImageSearchMatchRect),
      resolve: ({ query_match_rect }) => query_match_rect,
    },
  }),
})

export const ReverseImageSearchResults = new GraphQLObjectType({
  name: "ReverseImageSearchResults",
  fields: {
    results: {
      type: new GraphQLList(ReverseImageSearchResult),
    },
  },
})

const ArtworkImageSearchType = new GraphQLUnionType({
  name: "ArtworkImageSearchType",
  types: [ReverseImageSearchResults, ErrorsType],
  resolveType: ({ __typename }) => {
    if (__typename === "ReverseImageSearchResults") {
      return ReverseImageSearchResults
    }

    return ErrorsType
  },
})

export const artworkImageSearchResolver = async (
  _root,
  args,
  context,
  info
) => {
  const { image } = args
  const { meLoader, searchByImageLoader } = context

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

  // Without this hack, we will get an error that we are sending an unsupported file format
  // @ts-ignore
  stream.path = stream?._writeStream?._path

  const response = await searchByImageLoader({
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

  return {
    errors: response.error.map((error) => ({
      message: error,
      code: "invalid",
      path: [info.fieldName],
    })),
  }
}

export const ArtworkImageSearch: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtworkImageSearchType,
  description: "Search for matching artworks by image",
  args: {
    image: {
      description: "Image file",
      // TODO: Remove `as unknown` when "graphql" is updated to version 16.x.x
      // Wrong TS declaration for GraphQLScalarType in node_modules/graphql/type/definition.d.ts
      type: new GraphQLNonNull((GraphQLUpload as unknown) as GraphQLScalarType),
    },
  },
  resolve: artworkImageSearchResolver,
}
