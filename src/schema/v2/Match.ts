import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GraphQLFieldConfig } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArticleType } from "./article"
import { ArtistType } from "./artist"
import { ArtworkType } from "./artwork"
import { FairType } from "./fair"
import { FeatureType } from "./Feature"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { GeneType } from "./gene"
import { pageType } from "./page"
import { ProfileType } from "./profile"
import { SaleType } from "./sale"
import { SearchMode } from "./search"
import { SearchEntity } from "./search/SearchEntity"
import { ShowType } from "./show"
import { TagType } from "./tag"

const MODELS = {
  Article: { loader: "articleLoader", type: ArticleType },
  Artist: { loader: "artistLoader", type: ArtistType },
  Artwork: { loader: "artworkLoader", type: ArtworkType },
  Fair: { loader: "fairLoader", type: FairType },
  Feature: { loader: "featureLoader", type: FeatureType },
  Gene: { loader: "geneLoader", type: GeneType },
  Page: { loader: "pageLoader", type: pageType },
  Profile: { loader: "profileLoader", type: ProfileType },
  Sale: { loader: "saleLoader", type: SaleType },
  PartnerShow: { loader: "showLoader", type: ShowType },
  Tag: { loader: "tagLoader", type: TagType },
}

export const MatchType = new GraphQLUnionType({
  name: "Match",
  types: Object.values(MODELS).map(({ type }) => type),
  resolveType: ({ __typename }) => {
    return MODELS[__typename].type
  },
})

export const MatchConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: MatchType }).connectionType,
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
    },
    entities: {
      type: new GraphQLList(new GraphQLNonNull(SearchEntity)),
      description:
        "ARTIST_SERIES, CITY, COLLECTION, and VIEWING_ROOM are not yet supported",
      defaultValue: [
        "ARTICLE",
        "ARTIST",
        "ARTWORK",
        "FAIR",
        "FEATURE",
        "GALLERY",
        "GENE",
        "INSTITUTION",
        "PAGE",
        "PROFILE",
        "SALE",
        "SHOW",
        "TAG",
      ],
    },
    mode: {
      type: SearchMode,
      description: "Mode of search to execute",
      defaultValue: "SITE",
    },
    size: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  }),
  resolve: async (
    _root,
    { term, entities, mode, ...args },
    { searchLoader, ...loaders }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await searchLoader({
      term,
      entities,
      mode,
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    const results = await Promise.all(
      body.map(async ({ id, label }) => {
        const loader = loaders[MODELS[label].loader]
        const body = await loader(id)

        return { ...body, __typename: label }
      })
    )

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: results,
      args,
    })
  },
}
