import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { NullableIDField } from "schema/v2/object_identification"

const HomePageModuleParams = new GraphQLObjectType<any, ResolverContext>({
  name: "HomePageModulesParams",
  fields: {
    ...NullableIDField,
    followedArtistID: {
      type: GraphQLID,
      resolve: ({ followed_artist_id }) => followed_artist_id,
    },
    geneID: {
      type: GraphQLString,
      resolve: ({ gene_id }) => gene_id,
    },
    medium: {
      type: GraphQLString,
    },
    priceRange: {
      type: GraphQLString,
      resolve: ({ price_range }) => price_range,
    },
    relatedArtistID: {
      type: GraphQLID,
      resolve: ({ related_artist_id }) => related_artist_id,
    },
  },
})

const HomePageModuleParamsField: GraphQLFieldConfig<
  {
    params: {
      followed_artist_id: string
      gene_id: string
      id: string
      medium: string
      price_range: string
      related_artist_id: string
    }
  },
  ResolverContext
> = {
  type: HomePageModuleParams,
  resolve: ({ params }) => params,
}

export default HomePageModuleParamsField
