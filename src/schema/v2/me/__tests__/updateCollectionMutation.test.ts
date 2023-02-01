import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    updateCollection(input: { id: "collection-id", name: "Dining room" }) {
      responseOrError {
        ... on UpdateCollectionSuccess {
          collection {
            name
          }
        }

        ... on UpdateCollectionFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("updateCollection", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "collection-id",
      name: "Dining room",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        updateCollectionLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.updateCollectionLoader as jest.Mock).toHaveBeenCalledWith(
        "collection-id",
        {
          user_id: "user-42",
          name: "Dining room",
        }
      )
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        Object {
          "updateCollection": Object {
            "responseOrError": Object {
              "collection": Object {
                "name": "Dining room",
              },
            },
          },
        }
      `)
    })
  })

  it("returns failure when something went wrong", async () => {
    const message = `https://stagingapi.artsy.net/api/v1/collection - {"error":"Name Already exists."}`
    const error = new Error(message)
    const context = {
      updateCollectionLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "updateCollection": Object {
          "responseOrError": Object {
            "mutationError": Object {
              "message": "Name Already exists.",
            },
          },
        },
      }
    `)
  })
})
