import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { toTitleCase } from "@artsy/to-title-case"

import allAttributionClasses from "lib/attributionClasses"
import { COLORS, OLD_COLORS } from "lib/colors"

// Taken from Force's SizeFilter component
export const SIZES = {
  SMALL: "Small (under 40cm)",
  MEDIUM: "Medium (40 – 100cm)",
  LARGE: "Large (over 100cm)",
}

const ONE_IN_TO_CM = 2.54

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
      type: GraphQLNonNull(GraphQLString),
      description: "The GraphQL field name of the filter facet",
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: "The human-friendly name of the filter facet",
    },
    value: {
      type: GraphQLNonNull(GraphQLString),
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
    acquireable,
    atAuction,
    inquireableOnly,
    offerable,
    materialsTerms,
    locationCities,
    majorPeriods,
    colors,
    partnerIDs,
  } = parent

  const { artistLoader, partnerLoader } = context

  const labels: any[] = []

  labels.push(await getArtistLabels(artistIDs, artistLoader))
  labels.push(getRarityLabels(attributionClass))
  labels.push(getMediumLabels(additionalGeneIDs))
  labels.push(getPriceLabel(priceRange))
  labels.push(getSizeLabels(sizes))
  labels.push(getCustomSizeLabels({ width, height }))
  labels.push(
    getWaysToBuyLabels({
      acquireable,
      atAuction,
      inquireableOnly,
      offerable,
    })
  )
  labels.push(getMaterialLabels(materialsTerms))
  labels.push(getLocationLabels(locationCities))
  labels.push(getPeriodLabels(majorPeriods))
  labels.push(getColorLabels(colors))
  labels.push(await getPartnerLabels(partnerIDs, partnerLoader))

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

  const [min, max] = priceRange.split("-").map((value) => {
    return value === "*" ? value : (+value).toLocaleString()
  })

  let label

  if (min === "*") {
    label = `$0–$${max}`
  } else if (max === "*") {
    label = `$${min}+`
  } else {
    label = `$${min}–$${max}`
  }

  return {
    name: "Price",
    value: label,
    field: "priceRange",
  }
}

function getSizeLabels(sizes: string[]) {
  if (!sizes?.length) return []

  return sizes.map((size) => ({
    name: "Size",
    value: SIZES[`${size}`],
    field: "sizes",
  }))
}

const convertToCentimeters = (element: number) => {
  return Math.round(element * ONE_IN_TO_CM)
}

const parseRange = (range = ""): (number | "*")[] => {
  return range.split("-").map((s) => {
    if (s === "*") return s
    return convertToCentimeters(parseFloat(s))
  })
}

const extractSizeLabel = (prefix: string, value: string) => {
  const [min, max] = parseRange(value)

  let label
  if (max === "*") {
    label = `from ${min}`
  } else if (min === "*") {
    label = `to ${max}`
  } else {
    label = `${min}–${max}`
  }

  return `${prefix}: ${label} cm`
}

function getCustomSizeLabels({
  height,
  width,
}: {
  height: string
  width: string
}) {
  const labels: SearchCriteriaLabel[] = []

  if (width) {
    labels.push({
      name: "Size",
      value: extractSizeLabel("w", width),
      field: "width",
    })
  }

  if (height) {
    labels.push({
      name: "Size",
      value: extractSizeLabel("h", height),
      field: "height",
    })
  }

  return labels
}

function getWaysToBuyLabels(waysToBuy: {
  acquireable: boolean
  atAuction: boolean
  inquireableOnly: boolean
  offerable: boolean
}) {
  const { acquireable, atAuction, inquireableOnly, offerable } = waysToBuy
  const labels: SearchCriteriaLabel[] = []

  if (acquireable)
    labels.push({
      name: "Ways to Buy",
      value: "Buy Now",
      field: "acquireable",
    })

  if (atAuction)
    labels.push({
      name: "Ways to Buy",
      value: "Bid",
      field: "atAuction",
    })

  if (inquireableOnly)
    labels.push({
      name: "Ways to Buy",
      value: "Inquire",
      field: "inquireableOnly",
    })

  if (offerable)
    labels.push({
      name: "Ways to Buy",
      value: "Make Offer",
      field: "offerable",
    })

  return labels
}

function getMaterialLabels(materialsTerms: string[]) {
  if (!materialsTerms?.length) return []

  return materialsTerms.map((term) => {
    return {
      name: "Material",
      value: toTitleCase(term),
      field: "materialsTerms",
    }
  })
}

function getLocationLabels(locationCities: string[]): SearchCriteriaLabel[] {
  if (!locationCities?.length) return []

  return locationCities.map((city) => ({
    name: "Artwork Location",
    value: city,
    field: "locationCities",
  }))
}

function getPeriodLabels(majorPeriods: string[]) {
  if (!majorPeriods?.length) return []

  const DISPLAY_TEXT: Record<string, string> = {
    "2020": "2020–Today",
    "2010": "2010–2019",
    "2000": "2000–2009",
    "1990": "1990–1999",
    "1980": "1980–1989",
    "1970": "1970–1979",
    "1960": "1960–1969",
    "1950": "1950–1959",
    "1940": "1940–1949",
    "1930": "1930–1939",
    "1920": "1920–1929",
    "1910": "1910–1919",
    "1900": "1900–1909",
  }

  return majorPeriods.map((period) => {
    return {
      name: "Time Period",
      value: DISPLAY_TEXT[period] ?? period,
      field: "majorPeriods",
    }
  })
}

function getColorLabels(colors: string[]) {
  if (!colors?.length) return []

  return colors.map((value) => {
    const color = [...COLORS, ...OLD_COLORS].find((c) => value === c.value)
    if (!color) throw new Error(`Color not found: ${value}`)

    return {
      name: "Color",
      value: color.name,
      field: "colors",
    }
  })
}

async function getPartnerLabels(partnerIDs: string[], partnerLoader) {
  if (!partnerIDs?.length) return []

  return Promise.all(
    partnerIDs.map(async (id) => {
      const partner = await partnerLoader(id)
      return {
        name: "Galleries and Institutions",
        value: partner.name,
        field: "partnerIDs",
      }
    })
  )
}
