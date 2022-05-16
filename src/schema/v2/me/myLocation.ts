import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { existyValue } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { COUNTRIES, LatLngType } from "../location"
import { IDFields } from "../object_identification"

interface Response {
  id: string
  raw: string | null
  city: string | null
  display: string | null
  address: string | null
  address_2: string | null
  state: string | null
  state_code: string | null
  postal_code: string | null
  country: string | null
  country_code: string | null
  coordinates: {
    lng: number | null
    lat: number | null
  } | null
  timezone: string | null
  summary: string | null
}

export const myLocationType = new GraphQLObjectType<Response, ResolverContext>({
  name: "MyLocation",
  fields: () => ({
    ...IDFields,
    address: {
      type: GraphQLString,
      resolve: ({ address }) => existyValue(address),
    },
    address2: {
      type: GraphQLString,
      resolve: ({ address_2 }) => existyValue(address_2),
    },
    city: {
      type: GraphQLString,
      resolve: ({ city }) => existyValue(city),
    },
    coordinates: {
      type: new GraphQLNonNull(LatLngType),
      resolve: ({ coordinates }) => coordinates ?? {},
    },
    country: {
      type: GraphQLString,
      resolve: ({ country }) => existyValue(country),
    },
    countryCode: {
      type: GraphQLString,
      resolve: ({ country_code }) => existyValue(country_code),
    },
    displayCountry: {
      type: GraphQLString,
      resolve: ({ country }) => (country ? COUNTRIES[country] : null),
    },
    display: {
      type: GraphQLString,
      resolve: ({ display }) => existyValue(display),
    },
    postalCode: {
      type: GraphQLString,
      resolve: ({ postal_code }) => existyValue(postal_code),
    },
    state: {
      type: GraphQLString,
      resolve: ({ state }) => existyValue(state),
    },
    summary: {
      type: GraphQLString,
      resolve: ({ summary }) => existyValue(summary),
    },
    timezone: {
      type: GraphQLString,
      resolve: ({ timezone }) => existyValue(timezone),
    },
  }),
})
