import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { ResolverContext } from "types/graphql"
import { ShowsConnection } from "schema/v2/me/showsConnection"
import { emptyConnection } from "schema/v2/fields/pagination"
import { EventStatusEnums } from "schema/v2/input_fields/event_status"
import config from "config"

// custom timeout for development/staging
const SHOWS_TIMEOUT_MS =
  config.SYSTEM_ENVIRONMENT === "production" ? undefined : 10000

export const ShowsForYou: HomeViewSection = {
  id: "home-view-section-shows-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionShows,
  contextModule: ContextModule.showsRail,
  component: {
    title: "Shows for You",
  },
  requiresAuthentication: true,

  shouldBeDisplayed: (_context: ResolverContext) => true,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    if (!ShowsConnection.resolve) return emptyConnection

    const finalArgs = {
      ...args,
      status: EventStatusEnums.getValue("RUNNING_AND_UPCOMING")?.value,
    }

    const result = await ShowsConnection.resolve(
      parent,
      finalArgs,
      context,
      info
    )

    return result
  }, SHOWS_TIMEOUT_MS),
}
