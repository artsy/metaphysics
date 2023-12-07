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
import { isExisty } from "lib/helpers"
import _ from "lodash"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import {
  SearchCriteriaLabel,
  resolveSearchCriteriaLabels,
} from "./searchCriteriaLabel"
import { generateDisplayName } from "./generateDisplayName"
import { resolveHref } from "./resolveHref"

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
