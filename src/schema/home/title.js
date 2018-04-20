import { featuredAuction, featuredFair, featuredGene } from "./fetch"
import { GraphQLString } from "graphql"

const moduleTitle = {
  active_bids: () => "Your Active Bids",
  current_fairs: ({ rootValue: { fairsLoader } }) => {
    return featuredFair(fairsLoader).then(fair => {
      if (fair) {
        return `Current Fair: ${fair.name}`
      }
    })
  },
  followed_artist: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.followed_artist_id).then(artist => {
      return `Works by ${artist.name}`
    })
  },
  followed_artists: () => "Works by Artists you Follow",
  followed_galleries: () => "Works from Galleries You Follow",
  generic_gene: ({ params }) => {
    return params.title
  },
  genes: ({ rootValue: { followedGenesLoader }, params: { gene } }) => {
    if (gene) {
      return gene.name
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then(fetchedGene => {
      if (fetchedGene) {
        return fetchedGene.name
      }
    })
  },
  live_auctions: ({ rootValue: { salesLoader } }) => {
    return featuredAuction(salesLoader).then(auction => {
      if (auction) {
        return `Current Auction: ${auction.name}`
      }
    })
  },
  popular_artists: () => "Works by Popular Artists",
  recommended_works: () => "Recommended Works for You",
  related_artists: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.related_artist_id).then(artist => {
      return `Works by ${artist.name}`
    })
  },
  saved_works: () => "Recently Saved Works",
  recently_viewed_works: () => "Recently Viewed Works",
}

export default {
  type: GraphQLString,
  resolve: ({ key, display, params }, options, request, { rootValue }) => {
    if (display) return moduleTitle[key]({ rootValue, params: params || {} })
  },
}
