import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    createCollection(input: { name: "Dining room" }) {
      responseOrError {
        ... on CreateCollectionSuccess {
          collection {
            name
          }
        }

        ... on CreateCollectionFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("createCollection", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "id",
      name: "Dining room",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        createCollectionLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.createCollectionLoader as jest.Mock).toHaveBeenCalledWith({
        user_id: "user-42",
        name: "Dining room",
        saves: true,
      })
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        Object {
          "createCollection": Object {
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
      createCollectionLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "createCollection": Object {
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
