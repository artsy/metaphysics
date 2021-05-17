import proxy from "./proxies"
import { setVersion } from "./normalize"
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
  { version = ["large"], width, height }: CroppedImageArguments
): CroppedImageUrl => {
  const src = setVersion(image as any, version)

  const url1x = proxy(src, "crop", width, height)
  const url2x = proxy(src, "crop", width * 2, height * 2, 50)

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
      type: new GraphQLList(GraphQLString),
    },
  },
  type: CroppedImageUrlType,
  resolve: croppedImageUrl,
}

export default Cropped
