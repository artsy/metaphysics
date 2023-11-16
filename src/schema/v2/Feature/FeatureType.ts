import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { Array } from "runtypes"
import { markdown } from "schema/v2/fields/markdown"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import { Gravity } from "types/runtime"
import { OrderedSetConnection } from "../OrderedSet"
import { OrderedSetSortsEnum } from "../OrderedSet/OrderedSetSortsEnum"
import Image from "../image"
import { FeatureLayoutsEnum } from "./FeatureLayoutsEnum"
import { FeatureMetaType } from "./FeatureMeta"

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
    setsConnection: {
      type: OrderedSetConnection.connectionType,
      args: pageable({
        sort: {
          type: OrderedSetSortsEnum,
          defaultValue: "KEY_ASC",
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
