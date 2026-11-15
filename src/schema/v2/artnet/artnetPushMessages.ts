import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export interface ArtnetPushMessagesGravityResponse {
  messages: string[]
  gave_up: boolean
}

export const ArtnetPushMessagesType = new GraphQLObjectType<
  ArtnetPushMessagesGravityResponse,
  ResolverContext
>({
  name: "ArtnetPushMessages",
  description:
    "What Artnet had to say about the last push of this artwork. Artnet reports no severity and no failure state — work that went wrong comes back complete, carrying messages — so these say only that the push had something to report, not that it failed. Read `gaveUp` for the one hard distinction.",
  fields: {
    messages: {
      type: new GraphQLList(GraphQLString),
      description:
        "What Artnet said about the push, verbatim, plus Gravity's own reason when it gave up. A message can be a warning about work that still succeeded, such as an image Artnet could not add to an artwork it did create.",
      resolve: ({ messages }) => messages ?? [],
    },
    gaveUp: {
      type: GraphQLBoolean,
      description:
        "True when Gravity stopped asking how the push turned out, so the outcome is unknown rather than bad. False when Artnet itself reported these messages.",
      resolve: ({ gave_up }) => gave_up,
    },
  },
})
