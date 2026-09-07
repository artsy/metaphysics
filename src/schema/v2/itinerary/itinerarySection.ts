import { sortBy } from "lodash"
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { FixtureItinerarySection } from "./fixtures/itineraries"
import { ItineraryStopType } from "./itineraryStop"

export const ItinerarySectionType = new GraphQLObjectType<
  FixtureItinerarySection,
  ResolverContext
>({
  name: "ItinerarySection",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    title: {
      description:
        'An opaque display string for the section, e.g. "Day 1", ' +
        '"Morning", or "Peckham"',
      type: GraphQLString,
      resolve: ({ title }) => title,
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ position }) => position,
    },
    stopsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ stops_count }) => stops_count,
    },
    stops: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItineraryStopType))
      ),
      resolve: ({ stops }) => sortBy(stops, "position"),
    },
  },
})
