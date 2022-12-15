import { MaxDimensions, scale } from "proportional-scale"
import { getImageService } from "./services"
import { DEFAULT_SRCSET_QUALITY } from "./services/config"
import { normalizeQuality, setVersion } from "./normalize"
import {
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { OriginalImage } from "./index"

type ResizedImageArguments = {
  version?: string[]
  width?: number
  height?: number
  quality?: number[]
}

type ResizedImageUrl = {
  factor: number
  width: number | null
  height: number | null
  url: string
  src: string
  srcSet: string
}

export const resizedImageUrl = (
  image: OriginalImage,
  {
    version = ["large"],
    width: targetWidth,
    height: targetHeight,
    quality = DEFAULT_SRCSET_QUALITY,
  }: ResizedImageArguments = {},
  { imageService = "gemini" } = {}
): ResizedImageUrl => {
  const src = setVersion(image as any, version)

  const {
    original_width: originalWidth,
    original_height: originalHeight,
  } = image

  // If there is no input `width` or `height`, just return the `src`
  if (!targetWidth && !targetHeight) {
    return {
      factor: 1,
      width: originalWidth ?? null,
      height: originalHeight ?? null,
      url: src,
      src,
      srcSet: `${src} 1x`,
    }
  }

  // This will always have either a width, height or both — the incoming
  // types are slightly incorrect.
  // @ts-ignore
  const scaleTo: MaxDimensions = (() => {
    switch (true) {
      case targetWidth !== undefined && targetHeight !== undefined:
        return { maxWidth: targetWidth, maxHeight: targetHeight }
      case targetWidth !== undefined:
        return { maxWidth: targetWidth }
      case targetHeight !== undefined:
        return { maxHeight: targetHeight }
    }
  })()

  const scaled = scale({
    width: originalWidth ?? 0,
    height: originalHeight ?? 0,
    ...scaleTo,
  })

  const proxiedWidth = scaled.width || targetWidth
  const proxiedHeight = scaled.height || targetHeight
  const [quality1x, quality2x] = normalizeQuality(quality)

  const loader = getImageService(imageService)

  const url1x = loader({
    src,
    mode: "resize",
    width: proxiedWidth,
    height: proxiedHeight,
    quality: quality1x,
  })

  const url2x = loader({
    src,
    mode: "resize",
    width: (proxiedWidth || 0) * 2 || undefined,
    height: (proxiedHeight || 0) * 2 || undefined,
    quality: quality2x,
  })

  return {
    factor: scaled.scale,
    width: scaled.width || null,
    height: scaled.height || null,
    url: url1x,
    src: url1x,
    srcSet: `${url1x} 1x, ${url2x} 2x`,
  }
}

const ResizedImageUrlType = new GraphQLObjectType<
  ResizedImageUrl,
  ResolverContext
>({
  name: "ResizedImageUrl",
  fields: {
    factor: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    width: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
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

const Resized: GraphQLFieldConfig<
  OriginalImage,
  ResolverContext,
  ResizedImageArguments
> = {
  args: {
    width: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
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
  type: ResizedImageUrlType,
  resolve: resizedImageUrl,
}

export default Resized
