import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "../../sections"
import { HomeViewMixer } from "../HomeViewMixer"
import { HomeViewMixerRule } from "../HomeViewMixerRule"

describe("HomeViewMixer", () => {
  it("should apply all rules to produce the final section list", async () => {
    const context = {} as ResolverContext

    const INITIAL_SECTIONS = [
      BadArtworks, // should be removed
      OkayArtworks,
      GreatArtworks, // should be boosted to the top
    ]

    const mixer = new HomeViewMixer([
      new RemoveBadArtworksRule(),
      new BoostGreatArtworksRule(),
    ])

    const finalSections = await mixer.mix(INITIAL_SECTIONS, context)

    expect(finalSections).toEqual([
      GreatArtworks,
      OkayArtworks,
      // and BadArtworks has been removed
    ])
  })
})

// Mock rules

class RemoveBadArtworksRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    _context: ResolverContext
  ): Promise<HomeViewSection[]> {
    return sections.filter((section) => section.id !== BadArtworks.id)
  }
}

class BoostGreatArtworksRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    _context: ResolverContext
  ): Promise<HomeViewSection[]> {
    const greatArtworksSectionIndex = sections.findIndex(
      (section) => section.id === GreatArtworks.id
    )

    // move it to the top
    if (greatArtworksSectionIndex !== -1) {
      const greatArtworksSection = sections[greatArtworksSectionIndex]
      sections.splice(greatArtworksSectionIndex, 1)
      sections.unshift(greatArtworksSection)
    }

    return sections
  }
}

// Mock sections

const BadArtworks: HomeViewSection = {
  id: "home-view-section-bad",
  requiresAuthentication: false,
  type: "HomeViewSectionArtworks",
}

const OkayArtworks: HomeViewSection = {
  id: "home-view-section-okay",
  requiresAuthentication: false,
  type: "HomeViewSectionArtworks",
}

const GreatArtworks: HomeViewSection = {
  id: "home-view-section-great",
  requiresAuthentication: false,
  type: "HomeViewSectionArtworks",
}
