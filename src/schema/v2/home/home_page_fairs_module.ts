import Fair from "schema/v2/fair"
import { GraphQLList, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { groupBy } from "lodash"
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
        return fairsLoader(gravityOptions).then(
          ({ body: ungroupedRunningFairs }) => {
            // Gravity returns fairs that are both current and upcoming.
            // Make sure the current ones appear first in the results list.
            const now = moment.utc()
            const returnValue = groupBy(ungroupedRunningFairs, (fair) => {
              const startAt = moment.utc(fair.start_at)
              return now.isAfter(startAt) ? "current" : "upcoming"
            })

            const runningFairs = (returnValue["current"] || []).concat(
              returnValue["upcoming"] || []
            )

            // If there are less than 8, get the most recent closed fairs
            if (runningFairs.length < 8) {
              const newOptions = {
                ...gravityOptions,
                status: "closed",
                active: false,
                size: 8 - runningFairs.length,
              }
              return fairsLoader(newOptions).then(({ body: closedFairs }) => {
                const allFairs = runningFairs.concat(closedFairs)
                return allFairs.filter((fair) => fair.mobile_image)
              })
            }
            return runningFairs.filter((fair) => fair.mobile_image)
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
