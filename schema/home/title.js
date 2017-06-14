import { featuredAuction, featuredFair, featuredGene } from "./fetch"
import gravity from "lib/loaders/gravity"
import { GraphQLString } from "graphql"

const moduleTitle = {
  active_bids: () => "Your Active Bids",
  current_fairs: () => {
    return featuredFair().then(fair => {
      if (fair) {
        return `Current Fair: ${fair.name}`
      }
    })
  },
  followed_artist: ({ params }) => {
    return gravity(`artist/${params.followed_artist_id}`).then(artist => {
      return `Works by ${artist.name}`
    })
  },
  followed_artists: () => "Works by Artists you Follow",
  followed_galleries: () => "Works from Galleries You Follow",
  generic_gene: ({ params }) => {
    return params.title
  },
  genes: ({ accessToken, params: { gene } }) => {
    if (gene) {
      return gene.name
    }
    // Backward compatibility for Force.
    return featuredGene(accessToken).then(fetchedGene => {
      if (fetchedGene) {
        return fetchedGene.name
      }
    })
  },
  live_auctions: () => {
    return featuredAuction().then(auction => {
      if (auction) {
        return `Current Auction: ${auction.name}`
      }
    })
  },
  popular_artists: () => "Works by Popular Artists",
  recommended_works: () => "Recommended Works for You",
  related_artists: ({ params }) => {
    return gravity(`artist/${params.related_artist_id}`).then(artist => {
      return `Works by ${artist.name}`
    })
  },
  saved_works: () => "Recently Saved Works",
}

export default {
  type: GraphQLString,
  resolve: ({ key, display, params }, options, request, { rootValue: { accessToken } }) => {
    if (display) return moduleTitle[key]({ accessToken, params: params || {} })
  },
}
