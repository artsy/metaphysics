import { GraphQLFieldConfig } from "graphql"
import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { quizArtworkConnection } from "schema/v2/quiz/quizArtwork"

import { ResolverContext } from "types/graphql"

const QuizType = new GraphQLObjectType({
  name: "Quiz",
  fields: () => ({
    quizArtworks: { type: quizArtworkConnection.connectionType },
    completedAt: { type: GraphQLString },
    id: { type: GraphQLString },
  }),
})

export const Quiz: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The art quiz of a logged-in user",
  type: new GraphQLNonNull(QuizType),
  resolve: async ({ id }, args, { quizLoader }) => {
    if (!quizLoader) return

    const gravityOptions = Object.assign(
      { total_count: true },
      convertConnectionArgsToGravityArgs(args)
    )

    const quiz = await quizLoader(id, gravityOptions)

    console.log("quiz", quiz)

    return {
      id: quiz.id,
      completedAt: quiz.completed_at,
      quizArtworks: connectionFromArray(quiz.quiz_artworks, args),
    }
  },
}
