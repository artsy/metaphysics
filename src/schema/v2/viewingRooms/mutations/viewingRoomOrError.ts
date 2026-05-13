import { GraphQLNonNull, GraphQLUnionType } from "graphql"
import { ErrorsType } from "lib/gravityErrorHandler"
import { ViewingRoomType } from "schema/v2/viewingRoom"

export const ViewingRoomOrErrorType = new GraphQLNonNull(
  new GraphQLUnionType({
    name: "ViewingRoomOrErrorsUnion",
    types: [ViewingRoomType, ErrorsType],
    resolveType: (data) => {
      if (data.id) {
        return ViewingRoomType
      }

      return ErrorsType
    },
  })
)
