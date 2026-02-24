import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { InternalIDFields } from "../object_identification"
import { ResolverContext } from "types/graphql"
import date from "schema/v2/fields/date"
import GraphQLJSON from "graphql-type-json"

interface ModelChangeGravityResponse {
  id: string
  trackable_type: string
  trackable_id: string
  event: string
  fields_changed: string[]
  field_changes: Record<string, [unknown, unknown]>
  created_at: string
}

export const ModelChangeType = new GraphQLObjectType<
  ModelChangeGravityResponse,
  ResolverContext
>({
  name: "ModelChange",
  description: "A recorded change to a trackable model.",
  fields: {
    ...InternalIDFields,
    createdAt: date,
    event: {
      description: "The event type (create, update, delete).",
      type: new GraphQLNonNull(GraphQLString),
    },
    fieldChanges: {
      description:
        "A map of changed field names to [previous_value, next_value] pairs.",
      resolve: ({ field_changes }) => field_changes,
      type: new GraphQLNonNull(GraphQLJSON),
    },
    fieldsChanged: {
      description: "List of field names that were changed.",
      resolve: ({ fields_changed }) => fields_changed,
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
    trackableId: {
      description: "The ID of the changed record.",
      resolve: ({ trackable_id }) => trackable_id,
      type: new GraphQLNonNull(GraphQLString),
    },
    trackableType: {
      description: "The type of the changed record.",
      resolve: ({ trackable_type }) => trackable_type,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})
