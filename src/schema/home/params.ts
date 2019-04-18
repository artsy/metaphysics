import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

const HomePageModuleParams = new GraphQLObjectType<any, ResolverContext>({
  name: "HomePageModulesParams",
  fields: {
    ...InternalIDFields,
    followed_artist_id: {
      type: GraphQLID,
    },
    gene_id: {
      type: GraphQLString,
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
