import { GravityCityVideo } from "./types"

// Mirrors resolveCityArticleJoins: a join whose video isn't embedded (the
// video was deleted, or Gravity otherwise didn't attach it) is dropped
// rather than left to null out CityVideoType.video, a GraphQLNonNull field
// inside a GraphQLNonNull list — one bad join would otherwise null the
// entire cityVideos field, and with it the whole City node.
export const resolveCityVideoJoins = (
  joins: GravityCityVideo[]
): Array<
  GravityCityVideo & { video: NonNullable<GravityCityVideo["video"]> }
> =>
  joins.filter(
    (
      join
    ): join is GravityCityVideo & {
      video: NonNullable<GravityCityVideo["video"]>
    } => join.video != null
  )
