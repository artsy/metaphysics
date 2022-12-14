import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { quiz, QuizType } from "./quiz"
import { ResolverContext } from "types/graphql"

export const updateQuizMutation = mutationWithClientMutationId<
  {
    artworkId: string
    clearInteraction?: boolean
    userId: string
  },
  any,
  ResolverContext
>({
  name: "updateQuizMutation",
  description: "Update a quiz artwork interacted_with flag",
  inputFields: {
    artworkId: { type: new GraphQLNonNull(GraphQLString) },
    clearInteraction: { type: GraphQLBoolean },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    quiz: { type: QuizType, resolve: quiz.resolve },
  },
  mutateAndGetPayload: async (
    { artworkId, clearInteraction },
    { updateQuizLoader }
  ) => {
    if (!updateQuizLoader) return

    const params = {
      artwork_id: artworkId,
      clear_interaction: !!clearInteraction,
    }

    const result = await updateQuizLoader(params)
    return result
  },
})
