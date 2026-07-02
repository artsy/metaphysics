import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import {
  GraphQLString,
  Thunk,
  GraphQLFieldConfigMap,
  GraphQLBoolean,
} from "graphql"
import { IDFields } from "./object_identification"
import { ArtworkType } from "./artwork"
import { date } from "./fields/date"

export const edgeFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => ({
  ...IDFields,
  status: {
    type: GraphQLString,
    description:
      "This reflects the `title` attribute of the most recent embedded object in `statuses`",
    resolve: ({ statuses }) => {
      const statusesWithDates = statuses.map((obj) => {
        return { ...obj, createdAt: new Date(obj.created_at) }
      })

      const sortedStatusesReverseChronological = [...statusesWithDates].sort(
        (objA, objB) => objB.createdAt.getTime() - objA.createdAt.getTime()
      )

      return sortedStatusesReverseChronological[0]?.title
    },
  },
  outcome: { type: GraphQLString },
  note: { type: GraphQLString },
  createdAt: date(({ created_at }) => created_at),
  isSentToGallery: {
    type: GraphQLBoolean,
    resolve: ({ contact_gallery }) => !!contact_gallery,
  },
})

export const UserInquiredArtworksConnection = connectionWithCursorInfo({
  name: "UserInquiredArtworks",
  nodeType: ArtworkType,
  edgeFields: edgeFields,
}).connectionType
