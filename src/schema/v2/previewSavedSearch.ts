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
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "./artwork/artworkSizes"
import {
  resolveSearchCriteriaLabels,
  SearchCriteriaLabel,
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
  }),
})

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

const generateDisplayName = async (parent, args, context, info) => {
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
  const result = [artist, others.join(", ")].join(" — ")

  return result
}
