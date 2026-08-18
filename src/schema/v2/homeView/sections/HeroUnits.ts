import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { heroUnitsConnection } from "schema/v2/HeroUnit/heroUnitsConnection"
import { FOUNDATIONS_HERO_UNIT_ID } from "./FoundationsHeroUnit"

export const HeroUnits: HomeViewSection = {
  id: "home-view-section-hero-units",
  type: HomeViewSectionTypeNames.HomeViewSectionHeroUnits,
  contextModule: ContextModule.heroUnitsRail,
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const result = (await heroUnitsConnection.resolve!(
      parent,
      args,
      context,
      info
    )) as { edges: Array<{ node: { id: string } }>; totalCount: number }

    const originalEdges = result.edges ?? []
    const filteredEdges = originalEdges.filter(
      (edge) => edge?.node?.id !== FOUNDATIONS_HERO_UNIT_ID
    )
    const removedCount = originalEdges.length - filteredEdges.length

    return {
      ...result,
      edges: filteredEdges,
      totalCount: Math.max(0, (result.totalCount ?? 0) - removedCount),
    }
  }),
}
