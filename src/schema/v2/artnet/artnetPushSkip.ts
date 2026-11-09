import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export interface ArtnetPushSkipGravityResponse {
  field: string
  reason: string
}

export const ArtnetPushSkipType = new GraphQLObjectType<
  ArtnetPushSkipGravityResponse,
  ResolverContext
>({
  name: "ArtnetPushSkip",
  description:
    "A field the push could not send but did not refuse to push over, because Artnet's own limits leave it no form to send it in.",
  fields: {
    field: {
      type: GraphQLString,
      description:
        'The field left out of the push, e.g. "price" or "editions".',
    },
    reason: {
      type: GraphQLString,
      description: "Why Artnet could not be sent this field.",
    },
  },
})
