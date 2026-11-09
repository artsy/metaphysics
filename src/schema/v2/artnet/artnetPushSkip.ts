import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
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

// Gravity merges this into the pushed record's own body, so every push mutation
// reads it off the same payload.
export const ArtnetPushSkippedField: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: new GraphQLList(ArtnetPushSkipType),
  description:
    "Fields the push left out because Artnet cannot express them, which is why Artnet may show less than Gravity holds. Not a failure: the rest of the push went through.",
  resolve: ({ skipped }) => skipped ?? [],
}
