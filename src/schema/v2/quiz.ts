import { GraphQLFieldConfig } from "graphql"
import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { quizArtworkConnection } from "./quizArtworkConnection"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"

export const QuizType = new GraphQLObjectType({
  name: "Quiz",
  fields: () => ({
    ...InternalIDFields,
    quizArtworkConnection,
    completedAt: date(
      ({ completed_at }: { completed_at: string | null }) => completed_at
    ),
  }),
})

export const quiz: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The art quiz of a logged-in user",
  type: new GraphQLNonNull(QuizType),
  resolve: async ({ id }, _args, { quizLoader }) => {
    if (!quizLoader) return
    const quiz = await quizLoader(id)
    return quiz
  },
}
