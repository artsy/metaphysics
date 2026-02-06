import { DEFAULT_SRCSET_QUALITY } from "./services/config"
import { normalizeQuality, setVersion } from "./normalize"
import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { OriginalImage } from "./index"
import { gemini } from "./services/gemini"

type CroppedImageArguments = {
  version?: string[]
  width: number
  height: number
  quality?: number[]
  cachePolicy?: string
}

type CroppedImageUrl = {
  width: number
  height: number
  url: string
  src: string
  srcSet: string
  cachePolicy?: string
}

export const croppedImageUrl = (
  image: OriginalImage,
  {
    version = ["large"],
    width,
    height,
    quality = DEFAULT_SRCSET_QUALITY,
    cachePolicy,
  }: CroppedImageArguments
): CroppedImageUrl => {
  const src = setVersion(image as any, version)

  const [quality1x, quality2x] = normalizeQuality(quality)

  const url1x = gemini({
    src,
    mode: "crop",
    width,
    height,
    quality: quality1x,
    cachePolicy,
  })

  const url2x = gemini({
    src,
    mode: "crop",
    width: width * 2,
    height: height * 2,
    quality: quality2x,
    cachePolicy,
  })

  const result = {
    width,
    height,
    url: url1x,
    src: url1x,
    srcSet: `${url1x} 1x, ${url2x} 2x`,
    cachePolicy,
  }

  return result
}

const CroppedImageUrlType = new GraphQLObjectType<
  CroppedImageUrl,
  ResolverContext
>({
  name: "CroppedImageUrl",
  fields: {
    width: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    url: {
      type: new GraphQLNonNull(GraphQLString),
    },
    src: {
      type: new GraphQLNonNull(GraphQLString),
    },
    srcSet: {
      type: new GraphQLNonNull(GraphQLString),
    },
    cachePolicy: {
      type: GraphQLString,
    },
  },
})

const Cropped: GraphQLFieldConfig<
  OriginalImage,
  ResolverContext,
  CroppedImageArguments
> = {
  args: {
    width: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    version: {
      description: "Version to utilize in order of preference",
      type: new GraphQLList(GraphQLString),
    },
    quality: {
      description: "Value from 0-100; [1x, 2x]",
      type: new GraphQLList(new GraphQLNonNull(GraphQLInt)),
    },
    cachePolicy: {
      description: "Whether to use a short cache policy for the image",
      type: GraphQLString,
    },
  },
  type: CroppedImageUrlType,
  resolve: croppedImageUrl,
}

export default Cropped
