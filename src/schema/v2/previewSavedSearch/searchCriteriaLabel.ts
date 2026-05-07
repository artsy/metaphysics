import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { toTitleCase } from "@artsy/to-title-case"

import artworkMediums from "lib/artworkMediums"
import allAttributionClasses from "lib/attributionClasses"
import { COLORS } from "lib/colors"
import { compact, round } from "lodash"
import { DEFAULT_LENGTH_UNIT_PREFERENCE, camelCaseKeys } from "lib/helpers"
import { previewSavedSearchArgs } from "./previewSavedSearch"

export const SIZES_IN_CM = {
  SMALL: "Small (under 40cm)",
  MEDIUM: "Medium (40 – 100cm)",
  LARGE: "Large (over 100cm)",
}
export const SIZES_IN_INCHES = {
  SMALL: "Small (under 16in)",
  MEDIUM: "Medium (16in – 40in)",
  LARGE: "Large (over 40in)",
}

const ONE_IN_TO_CM = 2.54

export type SearchCriteriaLabel = {
  /** The GraphQL field name of the filter facet */
  field: string

  /** The human-friendly name of the filter facet */
  name:
    | "Artist"
    | "Artist Series"
    | "Artwork Location"
    | "Color"
    | "Galleries and Institutions"
    | "Material"
    | "Medium"
    | "Price"
    | "Rarity"
    | "Size"
    | "Time Period"
    | "Ways to Buy"

  /** The value of the filter facet */
  value: string

  /** The human-friendly label of the filter facet */
  displayValue: string
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
      description: "The value of the filter facet",
    },
    displayValue: {
      type: GraphQLNonNull(GraphQLString),
      description: "The human-friendly label of the filter facet",
    },
  },
})

/**
 * A resolver that takes the current SearchCriteria and returns a list of
 * SearchCriteriaLabels representing that SearchCriteria in human-friendly form
 */
export const resolveSearchCriteriaLabels = async (
  parent,
  args,
  context,
  _info
) => {
  const {
    artistIDs,
    artistSeriesIDs,
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
    // Converting all keys to camel case because they can come from Gravity's REST or GraphQL APIs.
  } = camelCaseKeys(parent) as any

  const labelsToReturn = searchCriteriaLabelsToReturn(args.only, args.except)

  const { artistLoader, meLoader, partnerLoader, artistSeriesLoader } = context

  const metric = await getPreferredMetric(meLoader)

  const labels: any[] = []

  if (labelsToReturn.includes("artistIDs")) {
    labels.push(await getArtistLabels(artistIDs, artistLoader))
  }
  if (labelsToReturn.includes("attributionClass")) {
    labels.push(getRarityLabels(attributionClass))
  }
  if (labelsToReturn.includes("additionalGeneIDs")) {
    labels.push(getMediumLabels(additionalGeneIDs))
  }
  if (labelsToReturn.includes("priceRange")) {
    labels.push(getPriceLabel(priceRange))
  }
  if (labelsToReturn.includes("sizes")) {
    labels.push(getSizeLabels(sizes, metric))
  }
  if (labelsToReturn.includes("width") || labelsToReturn.includes("height")) {
    labels.push(getCustomSizeLabels({ height, metric, width }))
  }
  if (
    labelsToReturn.includes("acquireable") ||
    labelsToReturn.includes("atAuction") ||
    labelsToReturn.includes("inquireableOnly") ||
    labelsToReturn.includes("offerable")
  ) {
    labels.push(
      getWaysToBuyLabels({
        acquireable,
        atAuction,
        inquireableOnly,
        offerable,
      })
    )
  }
  if (labelsToReturn.includes("materialsTerms")) {
    labels.push(getMaterialLabels(materialsTerms))
  }
  if (labelsToReturn.includes("locationCities")) {
    labels.push(getLocationLabels(locationCities))
  }
  if (labelsToReturn.includes("majorPeriods")) {
    labels.push(getPeriodLabels(majorPeriods))
  }
  if (labelsToReturn.includes("colors")) {
    labels.push(getColorLabels(colors))
  }
  if (labelsToReturn.includes("partnerIDs")) {
    labels.push(await getPartnerLabels(partnerIDs, partnerLoader))
  }
  if (labelsToReturn.includes("artistSeriesIDs")) {
    labels.push(
      await getArtistSeriesLabels(artistSeriesIDs, artistSeriesLoader)
    )
  }

  return labels.flat().filter((x) => x !== undefined) as SearchCriteriaLabel[]
}

export const SearchCriteriaFields = new GraphQLEnumType({
  name: "SearchCriteriaFields",
  values: Object.keys(previewSavedSearchArgs).reduce((acc, item) => {
    acc[item] = { value: item }
    return acc
  }, {}),
})

export const searchCriteriaLabelsToReturn = (
  only: string[] = [],
  except: string[] = []
) => {
  if (only.length > 0 && except.length > 0) {
    throw new GraphQLError(
      "You can't specify both `only` and `except` at the same time."
    )
  }

  let labelsToReturn = SearchCriteriaFields.getValues().map((x) => x.value)
  if (only.length > 0) {
    labelsToReturn = labelsToReturn.filter((label) => only.includes(label))
  }
  if (except.length > 0) {
    labelsToReturn = labelsToReturn.filter((label) => !except.includes(label))
  }
  return labelsToReturn
}

async function getArtistLabels(artistIDs: string[], artistLoader) {
  if (!artistIDs?.length) return []

  return Promise.all(
    artistIDs.map(async (id) => {
      const artist = await artistLoader(id)
      return {
        name: "Artist",
        displayValue: artist.name,
        value: id,
        field: "artistIDs",
      }
    })
  )
}

function getRarityLabels(attributionClasses: string[]) {
  if (!attributionClasses?.length) return []

  return attributionClasses.map((attributionClass) => ({
    name: "Rarity",
    displayValue: allAttributionClasses[attributionClass].name,
    value: attributionClass,
    field: "attributionClass",
  }))
}

function getArtworkMediumByGene(geneID: string) {
  const mediums = Object.assign(
    {
      drawing: {
        name: "Drawing",
        mediumFilterGeneSlug: "drawing",
        internalID: "4d90d18fdcdd5f44a5000016",
      },
    },
    artworkMediums
  )
  const fallbackMedium = { name: `Other (${geneID})` }
  const artworkMedium = Object.values(mediums).find(
    (entry) =>
      entry.mediumFilterGeneSlug === geneID || entry.internalID === geneID
  )

  return artworkMedium ?? fallbackMedium
}

function getMediumLabels(additionalGeneIDs: string[]) {
  if (!additionalGeneIDs?.length) return []

  return additionalGeneIDs.map((geneID) => {
    return {
      name: "Medium",
      displayValue: getArtworkMediumByGene(geneID).name,
      value: geneID,
      field: "additionalGeneIDs",
    }
  })
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
    displayValue: label,
    value: priceRange,
    field: "priceRange",
  }
}

function getSizeLabels(sizes: string[], metric) {
  if (!sizes?.length) return []

  return sizes.map((size) => {
    const sizeInUppercase = size.toUpperCase()

    return {
      name: "Size",
      displayValue:
        metric === "cm"
          ? SIZES_IN_CM[sizeInUppercase]
          : SIZES_IN_INCHES[sizeInUppercase],
      value: sizeInUppercase,
      field: "sizes",
    }
  })
}

const convertToCentimeters = (element: number) => {
  return Math.round(element * ONE_IN_TO_CM)
}

const parseRange = (range = "", metric: string): (number | "*")[] => {
  return range.split("-").map((s) => {
    if (s === "*") return s
    return metric === "cm"
      ? convertToCentimeters(parseFloat(s))
      : round(parseFloat(s), 1)
  })
}

const extractSizeLabel = (prefix: string, value: string, metric: string) => {
  const [min, max] = parseRange(value, metric)

  let label
  if (max === "*") {
    label = `from ${min}`
  } else if (min === "*") {
    label = `to ${max}`
  } else {
    label = `${min}–${max}`
  }

  return `${prefix}: ${label} ${metric}`
}

function getCustomSizeLabels({
  height,
  width,
  metric,
}: {
  height: string
  width: string
  metric: string
}) {
  const labels: SearchCriteriaLabel[] = []

  if (width) {
    labels.push({
      name: "Size",
      displayValue: extractSizeLabel("w", width, metric),
      value: width,
      field: "width",
    })
  }

  if (height) {
    labels.push({
      name: "Size",
      displayValue: extractSizeLabel("h", height, metric),
      value: height,
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
      displayValue: "Purchase",
      value: "true",
      field: "acquireable",
    })

  if (atAuction)
    labels.push({
      name: "Ways to Buy",
      displayValue: "Bid",
      value: "true",
      field: "atAuction",
    })

  if (inquireableOnly)
    labels.push({
      name: "Ways to Buy",
      displayValue: "Contact Gallery",
      value: "true",
      field: "inquireableOnly",
    })

  if (offerable)
    labels.push({
      name: "Ways to Buy",
      displayValue: "Make Offer",
      value: "true",
      field: "offerable",
    })

  return labels
}

function getMaterialLabels(materialsTerms: string[]) {
  if (!materialsTerms?.length) return []

  return materialsTerms.map((term) => {
    return {
      name: "Material",
      displayValue: toTitleCase(term),
      value: term,
      field: "materialsTerms",
    }
  })
}

function getLocationLabels(locationCities: string[]): SearchCriteriaLabel[] {
  if (!locationCities?.length) return []

  return locationCities.map((city) => ({
    name: "Artwork Location",
    displayValue: city,
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
      displayValue: DISPLAY_TEXT[period] ?? period,
      value: period,
      field: "majorPeriods",
    }
  })
}

function getColorLabels(colors: string[]) {
  if (!colors?.length) return []

  return colors.map((value) => {
    const color = COLORS.find((c) => value === c.value)
    if (!color) throw new Error(`Color not found: ${value}`)

    return {
      name: "Color",
      displayValue: color.name,
      value: color.value,
      field: "colors",
    }
  })
}

const getPreferredMetric = async (meLoader) => {
  if (!meLoader) return DEFAULT_LENGTH_UNIT_PREFERENCE

  const { length_unit_preference } = await meLoader()

  return length_unit_preference || DEFAULT_LENGTH_UNIT_PREFERENCE
}

async function getPartnerLabels(partnerIDs: string[], partnerLoader) {
  if (!partnerIDs?.length) return []

  return Promise.all(
    partnerIDs.map(async (id) => {
      const partner = await partnerLoader(id)
      return {
        name: "Galleries and Institutions",
        displayValue: partner.name,
        value: id,
        field: "partnerIDs",
      }
    })
  )
}

async function getArtistSeriesLabels(
  artistSeriesIDs: string[],
  artistSeriesLoader
) {
  if (!artistSeriesLoader || !artistSeriesIDs?.length) return []

  const result = await Promise.all(
    artistSeriesIDs.map(async (id) => {
      try {
        const { title } = await artistSeriesLoader(id)

        return {
          name: "Artist Series",
          displayValue: title,
          field: "artistSeriesIDs",
          value: id,
        }
      } catch (error) {
        if (error.statusCode === 404) {
          console.warn("Artist Series", id, "not found, skipping.")
        } else {
          throw error
        }
      }
    })
  )

  return compact(result)
}
