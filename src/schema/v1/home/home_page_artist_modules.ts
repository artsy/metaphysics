import { filter, map } from "lodash"
import {
  HomePageArtistModuleType,
  HomePageArtistModuleTypes,
} from "./home_page_artist_module"
import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const HomePageArtistModules: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(HomePageArtistModuleType),
  description: "Artist modules to show on the home screen",
  resolve: (_root, _params, context) => {
    // First check each type if they can display…
    return Promise.all(
      map(HomePageArtistModuleTypes, ({ display }, key) => {
        return display(context).then((displayable) => ({
          key,
          displayable,
        }))
      })
    ).then((results) => {
      // …then reduce list to those that can be displayed.
      return map(filter(results, "displayable"), ({ key }) => ({ key }))
    })
  },
}

export default HomePageArtistModules
