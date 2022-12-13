import { getImageService } from "./services"
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

type CroppedImageArguments = {
  version?: string[]
  width: number
  height: number
  quality?: number[]
}

type CroppedImageUrl = {
  width: number
  height: number
  url: string
  src: string
  srcSet: string
}

export const croppedImageUrl = (
  image: OriginalImage,
  {
    version = ["large"],
    width,
    height,
    quality = DEFAULT_SRCSET_QUALITY,
  }: CroppedImageArguments,
  { imageService = "gemini" } = {}
): CroppedImageUrl => {
  const src = setVersion(image as any, version)

  const [quality1x, quality2x] = normalizeQuality(quality)

  const loader = getImageService(imageService)

  const url1x = loader({
    src,
    mode: "crop",
    width,
    height,
    quality: quality1x,
  })

  const url2x = loader({
    src,
    mode: "crop",
    width: width * 2,
    height: height * 2,
    quality: quality2x,
  })

  return {
    width,
    height,
    url: url1x,
    src: url1x,
    srcSet: `${url1x} 1x, ${url2x} 2x`,
  }
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
  },
  type: CroppedImageUrlType,
  resolve: croppedImageUrl,
}

export default Cropped
