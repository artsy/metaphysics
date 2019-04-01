import sponsoredContentData from "./data.json"

interface CitySponsoredContent {
  /** Prose content for city */
  introText: string

  /** Link to external guide */
  artGuideUrl: string

  /** Manually curated list of sponsored shows */
  showIds: string

  /** Within the curated list, shows to feature more prominently */
  featuredShowIds: string
}

interface FairSponsoredContent {
  /** Prose content for fair */
  activationText: string

  /** Link to external press release */
  pressReleaseUrl: string
}

export const sponsoredContentForCity = (slug: string): CitySponsoredContent =>
  sponsoredContentData.cities[slug]

export const sponsoredContentForFair = (id: string): FairSponsoredContent =>
  sponsoredContentData.fairs[id]
