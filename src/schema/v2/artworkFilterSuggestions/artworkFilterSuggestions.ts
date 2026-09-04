import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "schema/v2/artwork/artworkSizes"

const ArtworkFilterSuggestionFiltersType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkFilterSuggestionFilters",
  fields: {
    geneIDs: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ gene_ids }) => gene_ids,
    },
    sizes: {
      // ArtworkSizes enum so values serialize to LARGE/MEDIUM/SMALL and can be
      // fed straight back into artworksConnection's `sizes: [ArtworkSizes]` arg.
      type: new GraphQLList(ArtworkSizes),
      resolve: ({ sizes }) => sizes,
    },
    colors: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ colors }) => colors,
    },
    attributionClass: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ attribution_class }) => attribution_class,
    },
    artistNationalities: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ artist_nationalities }) => artist_nationalities,
    },
    majorPeriods: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ major_periods }) => major_periods,
    },
    priceRange: {
      type: GraphQLString,
      resolve: ({ price_range }) => price_range,
    },
    framed: { type: GraphQLBoolean, resolve: ({ framed }) => framed },
    signed: { type: GraphQLBoolean, resolve: ({ signed }) => signed },
    forSale: { type: GraphQLBoolean, resolve: ({ for_sale }) => for_sale },
    acquireable: {
      type: GraphQLBoolean,
      resolve: ({ acquireable }) => acquireable,
    },
    offerable: { type: GraphQLBoolean, resolve: ({ offerable }) => offerable },
    atAuction: {
      type: GraphQLBoolean,
      resolve: ({ at_auction }) => at_auction,
    },
    inquireable: {
      type: GraphQLBoolean,
      resolve: ({ inquireable }) => inquireable,
    },
  },
})

const ArtworkFilterSuggestionDroppedType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkFilterSuggestionDropped",
  fields: {
    field: { type: GraphQLString, resolve: ({ field }) => field },
    value: { type: GraphQLString, resolve: ({ value }) => value },
  },
})

const ArtworkFilterSuggestionType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "ArtworkFilterSuggestion",
    fields: {
      keyword: {
        type: GraphQLString,
        description: "Leftover 'vibe' text to use as a keyword search.",
        resolve: ({ keyword }) => keyword,
      },
      filters: {
        type: ArtworkFilterSuggestionFiltersType,
        description: "Validated hard filters to pass to artworksConnection.",
        resolve: ({ filters }) => filters ?? {},
      },
      dropped: {
        type: new GraphQLNonNull(
          new GraphQLList(
            new GraphQLNonNull(ArtworkFilterSuggestionDroppedType)
          )
        ),
        description: "Values the parser rejected as invalid.",
        resolve: ({ dropped }) => dropped ?? [],
      },
      fellOpen: {
        type: GraphQLBoolean,
        description:
          "True when parsing failed and the query fell back to a plain keyword search.",
        resolve: ({ fell_open }) => fell_open,
      },
    },
  }
)

export const artworkFilterSuggestions: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ArtworkFilterSuggestionType,
  description:
    "Interpret a natural-language search query into validated artwork filters.",
  args: {
    query: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The natural-language search query.",
    },
  },
  resolve: async (_root, { query }, { artworkFilterSuggestionsLoader }) => {
    if (!artworkFilterSuggestionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return artworkFilterSuggestionsLoader({ nl_query: query })
  },
}
