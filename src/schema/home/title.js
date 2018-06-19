import { featuredAuction, featuredFair, featuredGene } from "./fetch"
import { GraphQLString } from "graphql"

const moduleTitle = {
  active_bids: () => "Your active bids",
  current_fairs: ({ rootValue: { fairsLoader } }) => {
    return featuredFair(fairsLoader).then(fair => fair && fair.name)
  },
  followed_artist: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.followed_artist_id).then(
      artist => artist && artist.name
    )
  },
  followed_artists: () => "Works by artists you follow",
  followed_galleries: () => "Works from galleries you follow",
  generic_gene: ({ params: { title } }) => title,
  genes: ({ rootValue: { followedGenesLoader }, params: { gene } }) => {
    if (gene) {
      return gene.name
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then(fetchedGene => {
      if (fetchedGene) {
        return fetchedGene.name
      }

      return undefined
    })
  },
  live_auctions: ({ rootValue: { salesLoader } }) => {
    return featuredAuction(salesLoader).then(auction => auction && auction.name)
  },
  popular_artists: () => "Works by popular artists",
  recommended_works: () => "Recommended works for you",
  related_artists: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.related_artist_id).then(
      artist => artist && artist.name
    )
  },
  saved_works: () => "Recently saved",
  similar_to_saved_works: () => "Similar to works you’ve saved",
  recently_viewed_works: () => "Recently viewed",
  similar_to_recently_viewed: () => "Similar to works you’ve viewed",
}

export default {
  type: GraphQLString,
  resolve: ({ key, display, params }, options, request, { rootValue }) => {
    if (display) return moduleTitle[key]({ rootValue, params: params || {} })
  },
}
