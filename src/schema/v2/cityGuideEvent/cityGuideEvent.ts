import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { date } from "schema/v2/fields/date"
import { ImageType } from "schema/v2/image"
import { imageFromGravity } from "schema/v2/itinerary/gravityImage"
import { ItineraryType } from "schema/v2/itinerary/itinerary"
import { attachStopItemsToMany } from "schema/v2/itinerary/stopItems"
import { GravityCityGuideEvent } from "./types"

export const CityGuideEventType = new GraphQLObjectType<
  GravityCityGuideEvent,
  ResolverContext
>({
  name: "CityGuideEvent",
  fields: () => ({
    id: GlobalIDField,
    internalID: {
      description: "The city guide event's UUID",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ slug }) => slug,
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ title }) => title,
    },
    subtitle: {
      type: GraphQLString,
      resolve: ({ subtitle }) => subtitle,
    },
    description: {
      type: GraphQLString,
      resolve: ({ description }) => description,
    },
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ city_slug }) => city_slug,
    },
    startAt: date(({ start_at }) => start_at, true),
    endAt: date(({ end_at }) => end_at, true),
    timeZone: {
      type: GraphQLString,
      resolve: ({ time_zone }) => time_zone,
    },
    publishedAt: date(({ published_at }) => published_at),
    heroImage: {
      type: ImageType,
      resolve: ({ image_url, image_urls }) =>
        imageFromGravity(image_url, image_urls),
    },
    itineraries: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItineraryType))
      ),
      resolve: ({ itineraries }, _args, context) =>
        attachStopItemsToMany(itineraries ?? [], context),
    },
    updatedAt: date(({ updated_at }) => updated_at, true),
  }),
})
