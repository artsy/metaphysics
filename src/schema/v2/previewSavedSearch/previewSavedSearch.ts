import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import artworkMediums from "lib/artworkMediums"
import attributionClasses from "lib/attributionClasses"
import { isExisty, snakeCaseKeys } from "lib/helpers"
import _ from "lodash"
import { stringify } from "qs"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import {
  SearchCriteriaLabel,
  resolveSearchCriteriaLabels,
} from "./searchCriteriaLabel"

const previewSavedSearchArgs: GraphQLFieldConfigArgumentMap = {
  acquireable: {
    type: GraphQLBoolean,
  },
  additionalGeneIDs: {
    type: new GraphQLList(GraphQLString),
  },
  artistIDs: {
    type: new GraphQLList(GraphQLString),
  },
  artistSeriesIDs: {
    type: new GraphQLList(GraphQLString),
  },
  atAuction: {
    type: GraphQLBoolean,
  },
  attributionClass: {
    type: new GraphQLList(GraphQLString),
  },
  colors: {
    type: new GraphQLList(GraphQLString),
  },
  height: {
    type: GraphQLString,
  },
  inquireableOnly: {
    type: GraphQLBoolean,
  },
  locationCities: {
    type: new GraphQLList(GraphQLString),
  },
  majorPeriods: {
    type: new GraphQLList(GraphQLString),
  },
  materialsTerms: {
    type: GraphQLList(GraphQLString),
  },
  offerable: {
    type: GraphQLBoolean,
  },
  partnerIDs: {
    type: new GraphQLList(GraphQLString),
  },
  priceRange: {
    type: GraphQLString,
  },
  sizes: {
    type: new GraphQLList(ArtworkSizes),
    description: "Filter results by Artwork sizes",
  },
  width: {
    type: GraphQLString,
  },
}

const ALLOWED_RARITY_SUGGESTIONS = ["unique", "limited edition"]

const PreviewSavedSearchType = new GraphQLObjectType<any, ResolverContext>({
  name: "PreviewSavedSearch",
  fields: () => ({
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: generateDisplayName,
      description:
        "A suggestion for a name that describes a set of saved search criteria in a conventional format",
    },
    labels: {
      type: new GraphQLNonNull(new GraphQLList(SearchCriteriaLabel)),
      resolve: resolveSearchCriteriaLabels,
      description:
        "Human-friendly labels that are added by Metaphysics to the upstream SearchCriteria type coming from Gravity",
    },
    href: {
      type: GraphQLString,
      description:
        "URL for a user to view the artwork grid with applied filters matching saved search criteria attributes",
      resolve: resolveHref,
    },
    suggestedFilters: {
      description:
        "Suggested filters for the user to use based on their search criteria",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(SearchCriteriaLabel))
      ),
      resolve: async ({ artistIDs }, _args, { filterArtworksLoader }) => {
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

        const mediumOptions = _.chain(
          getMostPopularOptions(aggregations["medium"])
        )
          .map((label) => getMediumSearchCriteriaLabel(label))
          .compact()
          .value()

        if (mediumOptions.length) {
          suggestedFilters.push(...mediumOptions)
        }

        return suggestedFilters
      },
    },
  }),
})

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

const PreviewSavedSearchAttributesType = new GraphQLInputObjectType({
  name: "PreviewSavedSearchAttributes",
  fields: previewSavedSearchArgs,
})

export const PreviewSavedSearchField: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: PreviewSavedSearchType,
  description: "A previewed saved search",
  args: {
    attributes: {
      type: PreviewSavedSearchAttributesType,
    },
  },
  resolve: (_parent, args, _context, _info) => {
    return args.attributes
  },
}

export const generateDisplayName = async (parent, args, context, info) => {
  if (parent?.userAlertSettings?.name) return parent?.userAlertSettings?.name

  const labels = await resolveSearchCriteriaLabels(parent, args, context, info)

  // artist always

  const artistLabels = labels.filter(({ name }) => name === "Artist")

  // then prioritized criteria

  const prioritizedLabels: SearchCriteriaLabel[][] = []

  const price = labels.filter(({ name }) => name === "Price")
  if (price) prioritizedLabels.push(price)

  const medium = labels.filter(({ name }) => name === "Medium")
  if (medium) prioritizedLabels.push(medium)

  const rarity = labels.filter(({ name }) => name === "Rarity")
  if (rarity) prioritizedLabels.push(rarity)

  // then other criteria

  const otherLabels: SearchCriteriaLabel[][] = []

  const size = labels.filter(({ name }) => name === "Size")
  if (size) otherLabels.push(size)

  const waysToBuy = labels.filter(({ name }) => name === "Ways to Buy")
  if (waysToBuy) otherLabels.push(waysToBuy)

  const material = labels.filter(({ name }) => name === "Material")
  if (material) otherLabels.push(material)

  const location = labels.filter(({ name }) => name === "Artwork Location")
  if (location) otherLabels.push(location)

  const period = labels.filter(({ name }) => name === "Time Period")
  if (period) otherLabels.push(period)

  const color = labels.filter(({ name }) => name === "Color")
  if (color) otherLabels.push(color)

  const partner = labels.filter(
    ({ name }) => name === "Galleries and Institutions"
  )
  if (partner) otherLabels.push(partner)

  const artistSeries = labels.filter(({ name }) => name === "Artist Series")
  if (artistSeries) otherLabels.push(artistSeries)

  // concatenate, compact, and trim

  const allLabels = [artistLabels, ...prioritizedLabels, ...otherLabels].filter(
    (labels) => labels.length > 0
  )

  const useableLabels = allLabels.slice(0, 4) // artist + up to 3 others

  // render

  const displayValues = useableLabels.map((labels) => {
    return labels.map((label) => label.displayValue).join(" or ")
  })
  const [artist, ...others] = displayValues
  let result = [artist, others.join(", ")].join(others.length > 0 ? " — " : "")

  const remainingCount = allLabels.length - useableLabels.length
  if (remainingCount > 0) result += ` + ${remainingCount} more`

  return result
}

const resolveHref = async (parent, _args, _context, _info) => {
  const primaryArtist = parent.artistIDs?.[0]

  if (!primaryArtist) return null

  // Filter out artistIDs and snake_case the rest of the attributes
  const criteriaAttributesWithoutArtistIds = (({ artistIDs, ...o }) =>
    snakeCaseKeys(o))(parent)
  const queryParams = stringify(criteriaAttributesWithoutArtistIds)

  return `/artist/${primaryArtist}?${queryParams}&for_sale=true`
}
