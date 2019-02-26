import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const HomePageModuleParams = new GraphQLObjectType<any, ResolverContext>({
  name: "HomePageModulesParams",
  fields: {
    followed_artist_id: {
      type: GraphQLID,
    },
    gene_id: {
      type: GraphQLString,
    },
    id: {
      type: GraphQLID,
    },
    medium: {
      type: GraphQLString,
    },
    price_range: {
      type: GraphQLString,
    },
    related_artist_id: {
      type: GraphQLID,
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
