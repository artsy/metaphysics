import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { HomeViewMixerRule } from "../HomeViewMixerRule"
import { HeroUnits } from "../../sections/HeroUnits"

const THRESHOLD_IN_HOURS = 2 * 7 * 24 // equals two weeks

/**
 * Rule that moves the HeroUnits section to the top of the list if the user is new.
 */
export class BoostHeroUnitsForNewUsersRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    const { userID, userByIDLoader } = context

    if (userID && userByIDLoader) {
      const user = await userByIDLoader(userID)
      const age = getAccountAgeInHours(user)

      if (age < THRESHOLD_IN_HOURS) {
        // find the HeroUnits section
        const heroUnitsIndex = sections.findIndex(
          (section) => section.id === HeroUnits.id
        )

        // move it to the top (after Quick Links and Tasks, i.e. index 2)
        if (heroUnitsIndex !== -1) {
          const heroUnitsSection = sections[heroUnitsIndex]
          sections.splice(heroUnitsIndex, 1)
          sections.splice(2, 0, heroUnitsSection)
        }
      }
    }

    return sections
  }
}

function getAccountAgeInHours(user) {
  const createdAt = user.created_at
  const accountAgeMillis = new Date().getTime() - new Date(createdAt).getTime()
  const accountAgeHours = accountAgeMillis / (1000 * 60 * 60)

  return accountAgeHours
}
