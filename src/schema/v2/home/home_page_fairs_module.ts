import Fair from "schema/v2/fair"
import { GraphQLList, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { filter } from "lodash"
import moment from "moment"

export const HomePageFairsModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageFairsModule",
  fields: {
    results: {
      type: new GraphQLNonNull(new GraphQLList(Fair.type)),
      resolve: (_root, _options, { fairsLoader }) => {
        // Check for all fairs that are currently running
        const gravityOptions = {
          has_full_feature: true,
          sort: "-start_at",
          active: true,
        }

        const now = moment.utc()

        return fairsLoader(gravityOptions).then(
          ({ body: unfilteredRunningFairs }) => {
            // Gravity returns fairs that are both current and upcoming.
            // Make sure only the current ones appear in the results list.
            const runningFairs = filter(unfilteredRunningFairs, (fair) => {
              const startAt = moment.utc(fair.start_at)
              return now.isAfter(startAt)
            })

            // If there are less than 8, get the most recent closed fairs
            if (runningFairs.length >= 8) {
              return runningFairs
            }

            const newOptions = {
              ...gravityOptions,
              status: "closed",
              active: false,
              size: 8 - runningFairs.length,
            }

            return fairsLoader(newOptions).then(
              ({ body: unfilteredClosedFairs }) => {
                const closedFairs = filter(unfilteredClosedFairs, (fair) => {
                  const endAt = moment.utc(fair.end_at)
                  return now.isAfter(endAt)
                })
                return runningFairs.concat(closedFairs)
              }
            )
          }
        )
      },
    },
  },
})

const HomePageFairsModule = {
  type: HomePageFairsModuleType,
  resolve: (_root, obj) => obj,
}

export default HomePageFairsModule
