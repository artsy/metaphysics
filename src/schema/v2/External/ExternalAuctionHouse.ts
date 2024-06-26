import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "../object_identification"

export interface Response {
  total_count: number
  total_pages: number
  current_page: number
  next_page: number
  _embedded: {
    auction_houses: AuctionHouse[]
  }
  _links: {
    self: Link
    next: Link
  }
}

interface AuctionHouse {
  id: number
  name: string
  country?: string
  city?: string
  end_at?: string
  start_at?: string
  _links: {
    self: Link
  }
}

interface Link {
  href: string
}

export const extenralAuctionHouseType = new GraphQLObjectType<
  AuctionHouse,
  ResolverContext
>({
  name: "ExternalAuctionHouse",
  fields: {
    ...IDFields,
    name: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: GraphQLString },
    country: { type: GraphQLString },
  },
})
