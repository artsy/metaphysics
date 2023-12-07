import _ from "lodash"
import artworkMediums from "lib/artworkMediums"
import attributionClasses from "lib/attributionClasses"
import { isExisty } from "lib/helpers"
import { SearchCriteriaLabel } from "./searchCriteriaLabel"

const ALLOWED_RARITY_SUGGESTIONS = ["unique", "limited edition"]

export const suggestedFilters = async (parent, _args, context) => {
  const { artistIDs } = parent.attributes
  const { filterArtworksLoader } = context

  if (!artistIDs) {
    throw new Error("artistIDs are required to get suggested filters")
  }

  const gravityArgs = {
    size: 0,
    aggregations: ["attribution_class", "medium"],
    artist_ids: artistIDs,
  }

  const { aggregations } = await filterArtworksLoader(gravityArgs)

  const suggestedFilters: SearchCriteriaLabel[] = []

  const rarityOptions = _.chain(
    getMostPopularOptions(aggregations["attribution_class"])
  )
    .map((label) => getRaritySearchCriteriaLabel(label))
    .compact()
    .filter((rarity) => ALLOWED_RARITY_SUGGESTIONS.includes(rarity.value))
    .value()

  if (rarityOptions.length) {
    suggestedFilters.push(...rarityOptions)
  }

  const mediumOptions = _.chain(getMostPopularOptions(aggregations["medium"]))
    .map((label) => getMediumSearchCriteriaLabel(label))
    .compact()
    .value()

  if (mediumOptions.length) {
    suggestedFilters.push(...mediumOptions)
  }

  return suggestedFilters
}

const getMostPopularOptions = (aggregation: {
  [key: string]: { name: string; count: number }
}): string[] => {
  if (isExisty(aggregation)) {
    const keys = Object.keys(aggregation).slice(0, 2)
    return keys
  }

  return []
}

const getRaritySearchCriteriaLabel = (
  value: string | undefined
): SearchCriteriaLabel | null => {
  if (!value) {
    return null
  }

  return {
    displayValue: attributionClasses[value].name,
    field: "attributionClass",
    value,
    name: "Rarity",
  }
}

const getMediumSearchCriteriaLabel = (
  value: string | undefined
): SearchCriteriaLabel | null => {
  if (!value) {
    return null
  }

  const mediumData = Object.values(artworkMediums).find((artworkMedium) => {
    return artworkMedium.mediumFilterGeneSlug === value
  })

  if (!mediumData || !mediumData.mediumFilterGeneSlug) {
    return null
  }

  return {
    displayValue: mediumData.name,
    field: "additionalGeneIDs",
    value: mediumData.mediumFilterGeneSlug,
    name: "Medium",
  }
}
