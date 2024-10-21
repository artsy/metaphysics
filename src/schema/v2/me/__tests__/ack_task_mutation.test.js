import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("AckTaskMutation", () => {
  it("acknowledges a task", async () => {
    const mutation = gql`
      mutation {
        ackTask(input: { id: "task-id" }) {
          taskOrError {
            ... on AckTaskSuccess {
              task {
                internalID
                title
              }
            }
            ... on AckTaskFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const mutationResponse = {
      ackTask: {
        taskOrError: {
          task: {
            internalID: "task-id",
            title: "Test Task",
          },
        },
      },
    }

    const context = {
      meAckTaskLoader: jest.fn().mockResolvedValue({
        id: "task-id",
        title: "Test Task",
      }),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual(mutationResponse)
  })

  it("returns an error when task acknowledgment fails", async () => {
    const mutation = gql`
      mutation {
        ackTask(input: { id: "task-id" }) {
          taskOrError {
            ... on AckTaskSuccess {
              task {
                id
                title
              }
            }
            ... on AckTaskFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const mutationResponse = {
      ackTask: {
        taskOrError: {
          mutationError: {
            message: "Resolved at already resolved",
          },
        },
      },
    }

    const context = {
      meAckTaskLoader: jest
        .fn()
        .mockRejectedValue(new Error("Resolved at already resolved")),
    }

    const data = await runAuthenticatedQuery(mutation, context)

    expect(data).toEqual(mutationResponse)
  })
})
