import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { startCase } from "lodash"

import allAttributionClasses from "lib/attributionClasses"

type SearchCriteriaLabel = {
  /** The GraphQL field name of the filter facet */
  field: string

  /** The human-friendly name of the filter facet */
  name: string

  /** The human-friendly value of the filter facet */
  value: string
}

/**
 * A type, derived here in Metaphysics from the upstream Gravity response,
 * that represents a SearchCriteria's filter in a human-friendly label,
 * suitable for use in a pill UI, for example.
 */
export const SearchCriteriaLabel = new GraphQLObjectType<
  SearchCriteriaLabel,
  ResolverContext
>({
  name: "SearchCriteriaLabel",
  description:
    "Human-friendly representation of a single SearchCriteria filter",
  fields: {
    field: {
      type: GraphQLString,
      description: "The GraphQL field name of the filter facet",
    },
    name: {
      type: GraphQLString,
      description: "The human-friendly name of the filter facet",
    },
    value: {
      type: GraphQLString,
      description: "The human-friendly value of the filter facet",
    },
  },
})

/**
 * A resolver that takes the current SearchCriteria and returns a list of
 * SearchCriteriaLabels representing that SearchCriteria in human-friendly form
 */
export const resolveSearchCriteriaLabels = async (
  parent,
  _args,
  context,
  _info
) => {
  const {
    artistIDs,
    attributionClass,
    additionalGeneIDs,
    priceRange,
    sizes,
    width,
    height,
  } = parent

  const { artistLoader } = context

  const labels: any[] = []

  labels.push(await getArtistLabels(artistIDs, artistLoader))
  labels.push(getRarityLabels(attributionClass))
  labels.push(getMediumLabels(additionalGeneIDs))
  labels.push(getPriceLabel(priceRange))
  labels.push(getSizeLabels(sizes))
  labels.push(getCustomSizeLabels({ width, height }))

  return labels.flat().filter((x) => x !== undefined) as SearchCriteriaLabel[]
}

async function getArtistLabels(artistIDs: string[], artistLoader) {
  if (!artistIDs?.length) return []

  return Promise.all(
    artistIDs.map(async (id) => {
      const artist = await artistLoader(id)
      return {
        name: "Artist",
        value: artist.name,
        field: "artistIDs",
      }
    })
  )
}

function getRarityLabels(attributionClasses: string[]) {
  if (!attributionClasses?.length) return []

  return attributionClasses.map((attributionClass) => ({
    name: "Rarity",
    value: allAttributionClasses[attributionClass].name,
    field: "attributionClass",
  }))
}

function getMediumLabels(additionalGeneIDs: string[]) {
  if (!additionalGeneIDs?.length) return []

  // Corresponds to the list of options under
  // the Medium facet on an artwork grid.
  //
  // Being a list of genes, this is related to,
  // but not the same as, the list of artwork medium types.

  const MEDIUM_GENES = {
    painting: "Painting",
    photography: "Photography",
    sculpture: "Sculpture",
    prints: "Prints",
    "work-on-paper": "Work on Paper",
    nft: "NFT",
    design: "Design",
    drawing: "Drawing",
    installation: "Installation",
    "film-slash-video": "Film/Video",
    jewelry: "Jewelry",
    "performance-art": "Performance Art",
    reproduction: "Reproduction",
    "ephemera-or-merchandise": "Ephemera or Merchandise",
  }

  return additionalGeneIDs.map((geneID) => ({
    name: "Medium",
    value: MEDIUM_GENES[geneID],
    field: "additionalGeneIDs",
  }))
}

function getPriceLabel(priceRange: string): SearchCriteriaLabel | undefined {
  if (!priceRange) return

  const [min, max] = priceRange.split(/-/)
  return {
    name: "Price",
    value: `USD ${min}–${max}`, // TODO: this a placeholder, we need to format these properly
    field: "priceRange",
  }
}

function getSizeLabels(sizes: string[]) {
  if (!sizes?.length) return []

  return sizes.map((size) => ({
    name: "Size",
    value: startCase(size.toLowerCase()), // TODO: this a placeholder, we need to format these properly
    field: "sizes",
  }))
}

function getCustomSizeLabels({
  height,
  width,
}: {
  height: string
  width: string
}) {
  const labels: SearchCriteriaLabel[] = []

  // TODO: this a placeholder, we need to format these properly

  if (width) {
    const [wmin, wmax] = width
      .split(/-/)
      .map(parseFloat)
      .map((n) => n * 2.54)
      .map(Math.round)

    labels.push({
      name: "Size",
      value: `w: ${wmin}–${wmax} cm`,
      field: "width",
    })
  }

  if (height) {
    const [hmin, hmax] = height
      .split(/-/)
      .map(parseFloat)
      .map((n) => n * 2.54)
      .map(Math.round)

    labels.push({
      name: "Size",
      value: `h: ${hmin}–${hmax} cm`,
      field: "height",
    })
  }

  return labels
}
