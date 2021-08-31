import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "../fields/date"

export interface Response {
  total_count: number
  total_pages: number
  current_page: number
  next_page: number
  _embedded: {
    fairs: Fair[]
  }
  _links: {
    self: Link
    next: Link
  }
}

interface Fair {
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

export const externalFairType = new GraphQLObjectType<Fair, ResolverContext>({
  name: "ExternalFair",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: GraphQLString },
    country: { type: GraphQLString },
    startAt: date(({ start_at }) => start_at),
    endAt: date(({ end_at }) => end_at),
  },
})
