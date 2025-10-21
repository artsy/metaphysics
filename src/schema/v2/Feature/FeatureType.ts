import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLBoolean,
} from "graphql"
import { Array } from "runtypes"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { Gravity } from "types/runtime"
import { ResolverContext } from "types/graphql"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import { markdown } from "schema/v2/fields/markdown"
import { OrderedSetConnection } from "../OrderedSet"
import { convertConnectionArgsToGravityArgs, existyValue } from "lib/helpers"
import { OrderedSetSortsEnum } from "../OrderedSet/OrderedSetSortsEnum"
import Image from "../image"
import { FeatureMetaType } from "./FeatureMeta"
import { FeatureLayoutsEnum } from "./FeatureLayoutsEnum"

export const FeatureType = new GraphQLObjectType<
  Gravity.Feature,
  ResolverContext
>({
  name: "Feature",
  description: "A Feature",
  fields: () => ({
    ...SlugAndInternalIDFields,
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    isActive: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ active }) => active,
    },
    description: markdown(),
    subheadline: markdown(),
    callout: markdown(),
    layout: {
      type: new GraphQLNonNull(FeatureLayoutsEnum),
    },
    image: Image,
    meta: {
      type: new GraphQLNonNull(FeatureMetaType),
      resolve: (feature) => feature,
    },
    metaTitle: {
      type: GraphQLString,
      resolve: ({ meta_title }) => existyValue(meta_title),
    },
    videoURL: {
      type: GraphQLString,
      resolve: ({ video_url }) => existyValue(video_url),
    },
    setsConnection: {
      type: OrderedSetConnection.connectionType,
      args: pageable({
        sort: {
          type: OrderedSetSortsEnum,
          defaultValue: OrderedSetSortsEnum.getValue("KEY_ASC")?.value,
        },
      }),
      description:
        "Features are composed of sets, which are themselves composed of items of various types",
      resolve: async ({ id }, args, { setsLoader }) => {
        const { page, size, offset, sort } = convertConnectionArgsToGravityArgs(
          args
        )

        const { body, headers } = await setsLoader({
          owner_type: "Feature",
          owner_id: id,
          total_count: true,
          page,
          size,
          sort,
        })

        const validated = Array(Gravity.OrderedSet).check(body)
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return {
          totalCount,
          ...connectionFromArraySlice(validated, args, {
            arrayLength: totalCount,
            sliceStart: offset,
          }),
        }
      },
    },
  }),
})
