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
import ArtworkSizes from "../artwork/artworkSizes"
import {
  SearchCriteriaLabel,
  resolveSearchCriteriaLabels,
} from "./searchCriteriaLabel"
import { generateDisplayName } from "./generateDisplayName"
import { resolveHref } from "./resolveHref"
import { suggestedFilters } from "./suggestedFilters"

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
      resolve: suggestedFilters,
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
