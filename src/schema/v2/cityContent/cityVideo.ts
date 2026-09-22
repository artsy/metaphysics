import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { VideoType } from "schema/v2/types/Video"
import { GravityCityVideo } from "./types"

// A join row (a video attached to a city), not the video itself.
// internalID here is the attachment's own id, needed to reorder or detach it later.
export const CityVideoType = new GraphQLObjectType<
  GravityCityVideo,
  ResolverContext
>({
  name: "CityVideo",
  fields: () => ({
    id: GlobalIDField,
    internalID: {
      description: "The attachment's own UUID, not the video's",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ city_slug }) => city_slug,
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ position }) => position,
    },
    video: {
      type: new GraphQLNonNull(VideoType),
      resolve: ({ video }) => video,
    },
  }),
})
