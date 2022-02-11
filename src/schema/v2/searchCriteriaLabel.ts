import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

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
  const { artistIDs, attributionClass } = parent

  const { artistLoader } = context

  const labels: any[] = []

  labels.push(await getArtistLabels(artistIDs, artistLoader))
  labels.push(getRarityLabels(attributionClass))

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
