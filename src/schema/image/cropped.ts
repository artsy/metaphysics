import _ from "lodash"
// FIXME: Module '"src/schema/image/proxies/index"' has no default export.
// @ts-ignore
import proxy from "./proxies"
import { setVersion } from "./normalize"
import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"

export const croppedImageUrl = (image, options) => {
  const opts = _.defaults(options, {
    version: ["large"],
  })

  const { width, height } = opts
  const src = setVersion(image, opts.version)
  const url = proxy(src, "crop", width, height)

  return {
    width,
    height,
    url,
  }
}

const CroppedImageUrlType = new GraphQLObjectType<ResolverContext>({
  name: "CroppedImageUrl",
  fields: {
    width: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
    },
    url: {
      type: GraphQLString,
    },
  },
})

export default {
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
