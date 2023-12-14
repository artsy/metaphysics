import _ from "lodash"
import artworkMediums from "lib/artworkMediums"
import attributionClasses from "lib/attributionClasses"
import { extractNodes, isExisty } from "lib/helpers"
import { SearchCriteriaLabel } from "./searchCriteriaLabel"
import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"

const ALLOWED_RARITY_SUGGESTIONS = ["unique", "limited edition"]
const MAX_SUGGESTIONS = 2
const MAX_ARTIST_SERIES_SUGGESTIONS = 5

export const suggestedFilters: GraphQLFieldResolver<
  any,
  ResolverContext,
  { [argName: string]: any }
> = async (parent, args, context) => {
  const { artistIDs } = parent
  const { source } = args
  const { filterArtworksLoader, gravityGraphQLLoader } = context

  if (!artistIDs) {
    throw new Error("artistIDs are required to get suggested filters")
  }

  if (source && (!source.type || !source.id)) {
    throw new Error("type and id are both required for alert source")
  }

  const gravityArgs = {
    size: 0,
    aggregations: ["attribution_class", "medium", "artist_series"],
    artist_ids: artistIDs,
  }

  const { aggregations } = await filterArtworksLoader(gravityArgs)

  const suggestedFilters: SearchCriteriaLabel[] = []

  let artistSeriesOptions: SearchCriteriaLabel[] | null

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

  if (source?.type === "Artwork") {
    artistSeriesOptions = await getArtistSeriesSearchCriteriaLabelsFromArtwork(
      source,
      gravityGraphQLLoader
    )
  } else {
    artistSeriesOptions = getArtistSeriesSearchCriteriaLabelsFromArtist(
      aggregations["artist_series"],
      MAX_SUGGESTIONS
    )
  }

  if (artistSeriesOptions) {
    suggestedFilters.push(...artistSeriesOptions)
  }

  return suggestedFilters
}

const getMostPopularOptions = (aggregation: {
  [key: string]: { name: string; count: number }
}): string[] => {
  if (isExisty(aggregation)) {
    const keys = Object.keys(aggregation).slice(0, MAX_SUGGESTIONS)
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

const getArtistSeriesSearchCriteriaLabelsFromArtist = (
  artistSeriesAggregation: Record<string, { name: string; count: number }>,
  limit?: number
): SearchCriteriaLabel[] | null => {
  if (!artistSeriesAggregation) {
    return null
  }

  const artistSeriesLabels = Object.entries(artistSeriesAggregation)
    .slice(0, limit ?? MAX_ARTIST_SERIES_SUGGESTIONS)
    .map(
      ([slug, value]: [string, any]): SearchCriteriaLabel => {
        return {
          displayValue: value.name,
          field: "artistSeriesIDs",
          value: slug,
          name: "Artist Series",
        }
      }
    )

  return artistSeriesLabels
}

const getArtistSeriesSearchCriteriaLabelsFromArtwork = async (
  source: { type: string; id: string },
  gravityGraphQLLoader,
  limit?: number
): Promise<SearchCriteriaLabel[] | null> => {
  if (!source || source.type !== "Artwork" || !source.id) {
    return null
  }

  const data = await gravityGraphQLLoader({
    query: gql`
      query GetArtistSeriesFromArtwork($id: ID!) {
        artistSeriesConnection(artworkID: $id, first: 5) {
          edges {
            node {
              internalID
              slug
              title
            }
          }
        }
      }
    `,
    variables: { id: source.id },
  })

  const nodes = extractNodes<{
    internalID: string
    slug: string
    title: string
  }>(data.artistSeriesConnection)

  const artistSeriesLabels: SearchCriteriaLabel[] = nodes
    .slice(0, limit ?? MAX_ARTIST_SERIES_SUGGESTIONS)
    .map((node) => ({
      displayValue: node.title,
      field: "artistSeriesIDs",
      value: node.slug,
      name: "Artist Series",
    }))

  return artistSeriesLabels
}
