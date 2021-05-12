import { scale } from "proportional-scale"
import proxy from "./proxies"
import { setVersion } from "./normalize"
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
  }: ResizedImageArguments = {}
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

  const scaleTo = !!targetWidth
    ? { maxWidth: targetWidth! }
    : { maxHeight: targetHeight! }

  const scaled = scale({
    width: originalWidth ?? 0,
    height: originalHeight ?? 0,
    ...scaleTo,
  })

  const proxiedWidth = scaled.width || targetWidth
  const proxiedHeight = scaled.height || targetHeight

  const url1x = proxy(src, "resize", proxiedWidth, proxiedHeight)
  const url2x = proxy(
    src,
    "resize",
    (proxiedWidth || 0) * 2 || undefined,
    (proxiedHeight || 0) * 2 || undefined,
    50
  )

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
      type: new GraphQLList(GraphQLString),
    },
  },
  type: ResizedImageUrlType,
  resolve: resizedImageUrl,
}

export default Resized
