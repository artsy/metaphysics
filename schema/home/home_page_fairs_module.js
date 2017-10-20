import Fair from "schema/fair"
import { GraphQLList, GraphQLObjectType } from "graphql"

export const HomePageFairsModuleType = new GraphQLObjectType({
  name: "HomePageFairsModule",
  fields: {
    results: {
      type: new GraphQLList(Fair.type),
      resolve: (root, options, request, { rootValue: { fairsLoader } }) => {
        // Check for all fairs that are currently running
        const isEligible = { has_full_feature: true, sort: "-start_at" }
        const gravityOptions = { ...options, ...isEligible, active: true }
        return fairsLoader(gravityOptions).then(runningFairs => {
          // If there are less than 8, get the most recent closed fairs
          if (runningFairs.length < 8) {
            gravityOptions.status = "closed"
            gravityOptions.active = false
            const newOptions = { ...gravityOptions, size: 8 - runningFairs.length }
            return fairsLoader(newOptions).then(closedFairs => {
              const allFairs = runningFairs.concat(closedFairs)
              return allFairs
            })
          }
          return runningFairs
        })
      },
    },
  },
})

const HomePageFairsModule = {
  type: HomePageFairsModuleType,
  resolve: (root, obj) => obj,
}

export default HomePageFairsModule
