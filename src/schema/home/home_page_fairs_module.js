import Fair from "schema/fair"
import { GraphQLList, GraphQLObjectType, GraphQLNonNull } from "graphql"

export const HomePageFairsModuleType = new GraphQLObjectType({
  name: "HomePageFairsModule",
  fields: {
    results: {
      type: new GraphQLNonNull(new GraphQLList(Fair.type)),
      resolve: (root, options, request, { rootValue: { fairsLoader } }) => {
        // Check for all fairs that are currently running
        const gravityOptions = {
          has_full_feature: true,
          sort: "-start_at",
          active: true,
        }
        return fairsLoader(gravityOptions).then(runningFairs => {
          // If there are less than 8, get the most recent closed fairs
          if (runningFairs.length < 8) {
            const newOptions = {
              ...gravityOptions,
              status: "closed",
              active: false,
              size: 8 - runningFairs.length,
            }
            return fairsLoader(newOptions).then(closedFairs => {
              const allFairs = runningFairs.concat(closedFairs)
              return allFairs.filter(fair => fair.mobile_image)
            })
          }
          return runningFairs.filter(fair => fair.mobile_image)
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
