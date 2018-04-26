import { featuredAuction, featuredFair, featuredGene } from "./fetch"
import { GraphQLString } from "graphql"

const simpleSentenceCase = (title) => {
  const lowercase = title.toLowerCase()
  return lowercase.charAt(0).toUpperCase() + lowercase.slice(1)
}

const moduleTitle = {
  active_bids: () => "Your active bids",
  current_fairs: ({ rootValue: { fairsLoader } }) => {
    return featuredFair(fairsLoader).then(fair => {
      if (fair) {
        return `Current fair: ${fair.name}`
      }
    })
  },
  followed_artist: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.followed_artist_id).then(artist => {
      return `Works by ${artist.name}`
    })
  },
  followed_artists: () => "Works by artists you follow",
  followed_galleries: () => "Works from galleries you follow",
  generic_gene: ({ params: { title } }) => {
    return simpleSentenceCase(title)
  },
  genes: ({ rootValue: { followedGenesLoader }, params: { gene } }) => {
    if (gene) {
      return simpleSentenceCase(gene.name)
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then(fetchedGene => {
      if (fetchedGene) {
        return simpleSentenceCase(fetchedGene.name)
      }
    })
  },
  live_auctions: ({ rootValue: { salesLoader } }) => {
    return featuredAuction(salesLoader).then(auction => {
      if (auction) {
        return `Current auction: ${auction.name}`
      }
    })
  },
  popular_artists: () => "Works by popular artists",
  recommended_works: () => "Recommended works for you",
  related_artists: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.related_artist_id).then(artist => {
      return `Works by ${artist.name}`
    })
  },
  saved_works: () => "Recently saved works",
  recently_viewed_works: () => "Recently viewed works",
}

export default {
  type: GraphQLString,
  resolve: ({ key, display, params }, options, request, { rootValue }) => {
    if (display) return moduleTitle[key]({ rootValue, params: params || {} })
  },
}
