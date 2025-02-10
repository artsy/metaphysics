import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Fair from "../fair"

export const FeaturedFairs: GraphQLFieldConfig<void, ResolverContext> = {
  description:
    "A list of currently running featured fairs, backfilled with past fairs. Fairs are sorted by start date in descending order.",
  type: GraphQLList(Fair.type),
  args: {
    includeBackfill: { type: GraphQLBoolean, defaultValue: true },
    size: { type: GraphQLInt },
  },
  resolve: async (_root, args, { fairsLoader }) => {
    const sharedOptions = {
      has_full_feature: true,
      sort: "-start_at",
    }

    const runningFairs = await fairsLoader({
      ...sharedOptions,
      status: "running",
      size: args.size,
    })

    let fairs = runningFairs.body

    if (args.includeBackfill && fairs.length < args.size) {
      const backfillFairs = await fairsLoader({
        ...sharedOptions,
        status: "closed",
        size: Math.min(args.size - fairs.length, 5),
      })

      fairs = fairs.concat(backfillFairs.body)
    }

    return fairs
  },
}
