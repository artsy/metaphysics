import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("DismissTaskMutation", () => {
  it("dismisses a task", async () => {
    const mutation = gql`
      mutation {
        dismissTask(input: { id: "task-id" }) {
          taskOrError {
            ... on DismissTaskSuccess {
              task {
                internalID
                title
              }
              homeViewTasksSection {
                tasksConnection(first: 10) {
                  edges {
                    node {
                      internalID
                      title
                    }
                  }
                }
              }
            }
            ... on DismissTaskFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const mutationResponse = {
      dismissTask: {
        taskOrError: {
          task: {
            internalID: "task-id",
            title: "Test Task",
          },
          homeViewTasksSection: {
            tasksConnection: {
              edges: [
                { node: { internalID: "asdf1234", title: "Remaining Task" } },
              ],
            },
          },
        },
      },
    }

    const context = {
      meDismissTaskLoader: jest.fn().mockResolvedValue({
        id: "task-id",
        title: "Test Task",
      }),
      meTasksLoader: jest.fn().mockResolvedValue({
        body: [{ id: "asdf1234", title: "Remaining Task" }],
        headers: { "x-total-count": 1 },
      }),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual(mutationResponse)
  })

  it("returns an error when task dismissal fails", async () => {
    const mutation = gql`
      mutation {
        dismissTask(input: { id: "task-id" }) {
          taskOrError {
            ... on DismissTaskSuccess {
              task {
                id
                title
              }
            }
            ... on DismissTaskFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const mutationResponse = {
      dismissTask: {
        taskOrError: {
          mutationError: {
            message: "Dismissed at already dismissed",
          },
        },
      },
    }

    const context = {
      meDismissTaskLoader: jest
        .fn()
        .mockRejectedValue(new Error("Dismissed at already dismissed")),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual(mutationResponse)
  })
})
