import { ContextModule } from "@artsy/cohesion"
import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { emptyConnection } from "schema/v2/fields/pagination"

export const FOUNDATIONS_HERO_UNIT_ID = "613523c3-30ce-49a7-aa21-e617bca1cc7b"

export const FoundationsHeroUnit: HomeViewSection = {
  id: "home-view-section-foundations-hero-unit",
  type: HomeViewSectionTypeNames.HomeViewSectionHeroUnits,
  contextModule: ContextModule.heroUnitsRail,
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (_parent, _args, context) => {
    const loader = context.authenticatedHeroUnitLoader ?? context.heroUnitLoader

    if (!loader) return emptyConnection

    try {
      const { body } = await loader(FOUNDATIONS_HERO_UNIT_ID)

      if (!body) return emptyConnection

      return {
        totalCount: 1,
        ...connectionFromArray([body], {}),
      }
    } catch {
      return emptyConnection
    }
  }),
}
