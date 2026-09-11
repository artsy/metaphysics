import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"

// Gravity's FairEvent JSON has no `_id`, only `id` (the raw Mongo id, not a
// slug, unlike Fair). See app/models/domain/fair_event.rb `json_fields`.
export const FairEventType = new GraphQLObjectType<any, ResolverContext>({
  name: "FairEvent",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: ({ id }) => id,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    startAt: date(({ start_at }) => start_at),
    endAt: date(({ end_at }) => end_at),
  },
})
