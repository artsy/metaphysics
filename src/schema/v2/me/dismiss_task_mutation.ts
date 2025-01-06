import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { Task, TaskType } from "./task"
import { HomeViewTasksSectionType } from "../homeView/sectionTypes/Tasks"
import { Tasks } from "../homeView/sections/Tasks"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DismissTaskSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    task: {
      type: new GraphQLNonNull(TaskType),
      resolve: (response) => {
        return response
      },
    },
    homeViewTasksSection: {
      type: HomeViewTasksSectionType,
      resolve: () => Tasks.resolver,
    },
    // tasksConnection: {
    //   type: TaskConnectionType,
    //   args: pageable({}),
    //   resolve: async (_parent, args, { meTasksLoader }) => {
    //     if (!meTasksLoader)
    //       throw new Error(
    //         "There must have been a user, but no task loader... :/"
    //       )

    //     const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    //     const { body: results, headers } = await meTasksLoader({
    //       page,
    //       size,
    //       total_count: true,
    //     })

    //     const count = parseInt(headers["x-total-count"] || "0", 10)

    //     return {
    //       totalCount: count,
    //       pageCursors: createPageCursors({ ...args, page, size }, count),
    //       ...connectionFromArraySlice(results, args, {
    //         arrayLength: count,
    //         sliceStart: offset,
    //       }),
    //     }
    //   },
    // },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "DismissTaskFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(GravityMutationErrorType),
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DismissTaskResponseOrError",
  types: [SuccessType, ErrorType],
  resolveType: (data) =>
    data._type === "GravityMutationError" ? ErrorType : SuccessType,
})

export const dismissTaskMutation = mutationWithClientMutationId<
  Input,
  Task | null,
  ResolverContext
>({
  name: "DismissTaskMutation",
  description: "Updates a Task on the logged in User",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    taskOrError: {
      type: new GraphQLNonNull(ResponseOrErrorType),
      description: "On success: the new state of the Task",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { meDismissTaskLoader }) => {
    if (!meDismissTaskLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const task: Task = await meDismissTaskLoader?.(id)

      return { ...task, __typename: "SuccessType" }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        return {
          message: error.message,
          _type: "GravityMutationError",
        }
      }
    }
  },
})
