import { defaults } from "lodash"
import proxy from "./proxies"
import { scale } from "proportional-scale"
import { setVersion } from "./normalize"
import {
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const resizedImageUrl = (
  image,
  args: { width?: number; height?: number; version?: string[] }
) => {
  const options = defaults(args, { version: ["large"] })
  const src: string = setVersion(image, options.version)

  if (!image.original_height && !image.original_width) {
    return {
      src,
      factor: Infinity,
      width: null,
      height: null,
      resize: {
        width: options.width,
        height: options.height,
      },
    }
  }

  const { width, height, scale: factor } = scale({
    width: image.original_width,
    height: image.original_height,
    maxWidth: options.width!,
    maxHeight: options.height!,
  })

  return {
    src,
    factor,
    width,
    height,
    resize: {
      width: width || options.width,
      height: height || options.height,
    },
  }
}

// TODO: Test out and refine equivalent perceptual qualities on actual devices
export const SUPPORTED_PIXEL_DENSITIES = [
  { density: 1, quality: 80 },
  { density: 2, quality: 65 },
  { density: 3, quality: 50 },
]

const ResizedImageUrlType = new GraphQLObjectType<
  ReturnType<typeof resizedImageUrl>,
  ResolverContext
>({
  name: "ResizedImageUrl",
  fields: {
    factor: {
      type: GraphQLFloat,
    },
    width: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
    },
    url: {
      type: GraphQLString,
      resolve: ({ src, resize: { width, height } }) =>
        proxy(src, "resize", width, height),
    },
    src: {
      type: GraphQLString,
      resolve: ({ src, resize: { width, height } }) =>
        proxy(src, "resize", width, height),
    },
    srcSet: {
      type: GraphQLString,
      description:
        "Returns a `srcSet` string with 1x, 2x, 3x pixel densities based on passed in arguments",
      resolve: ({ src, resize: { width, height } }) =>
        SUPPORTED_PIXEL_DENSITIES.map(({ density, quality }) =>
          proxy(
            src,
            "resize",
            width && width * density,
            height && height * density,
            quality
          )
        ).join(", "),
    },
  },
})

const Resized: GraphQLFieldConfig<void, ResolverContext> = {
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
