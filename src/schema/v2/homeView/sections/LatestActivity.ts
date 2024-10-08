import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { NotificationsConnection } from "schema/v2/notifications"

export const LatestActivity: HomeViewSection = {
  id: "home-view-section-latest-activity",
  type: HomeViewSectionTypeNames.HomeViewSectionActivity,
  contextModule: ContextModule.activityRail,
  component: {
    title: "Latest Activity",
    behaviors: {
      viewAll: {
        href: "/notifications",
        buttonText: "See All",
        ownerType: OwnerType.activities,
      },
    },
  },
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    return await NotificationsConnection.resolve!(parent, args, context, info)
  }),
}
