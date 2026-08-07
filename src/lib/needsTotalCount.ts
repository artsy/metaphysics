import { GraphQLResolveInfo } from "graphql"
import { hasIntersectionWithSelectionSet } from "./hasFieldSelection"

export const needsTotalCount = (info: GraphQLResolveInfo): boolean =>
  hasIntersectionWithSelectionSet(info, ["totalCount", "pageCursors"])
