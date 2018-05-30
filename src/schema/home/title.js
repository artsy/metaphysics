import { featuredAuction, featuredFair, featuredGene } from "./fetch"
import { GraphQLString } from "graphql"

const moduleTitle = {
  active_bids: () => {return "Your active bids"},
  current_fairs: ({ rootValue: { fairsLoader } }) =>
    {return featuredFair(fairsLoader).then(fair => {return fair && fair.name})},
  followed_artist: ({ rootValue: { artistLoader }, params }) =>
    {return artistLoader(params.followed_artist_id).then(
      artist => {return artist && artist.name}
    )},
  followed_artists: () => {return "Works by artists you follow"},
  followed_galleries: () => {return "Works from galleries you follow"},
  generic_gene: ({ params: { title } }) => {return title},
  genes: ({ rootValue: { followedGenesLoader }, params: { gene } }) => {
    if (gene) {
      return gene.name
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then(fetchedGene => {
      if (fetchedGene) {
        return fetchedGene.name
      }

      return undefined // make undefined return explicit
    })
  },
  live_auctions: ({ rootValue: { salesLoader } }) =>
    {return featuredAuction(salesLoader).then(auction => {return auction && auction.name})},
  popular_artists: () => {return "Works by popular artists"},
  recommended_works: () => {return "Recommended works for you"},
  related_artists: ({ rootValue: { artistLoader }, params }) =>
    {return artistLoader(params.related_artist_id).then(
      artist => {return artist && artist.name}
    )},
  saved_works: () => {return "Recently saved"},
  similar_to_saved_works: () => {return "Similar to works you’ve saved"},
  recently_viewed_works: () => {return "Recently viewed"},
  similar_to_recently_viewed: () => {return "Similar to works you’ve viewed"},
}

export default {
  type: GraphQLString,
  resolve: ({ key, display, params }, options, request, { rootValue }) => {
    if (display) return moduleTitle[key]({ rootValue, params: params || {} })
    return undefined // make undefined return explicit
  },
}
