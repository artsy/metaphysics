import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    deleteInstagramAccount(input: { id: "ig-1" }) {
      instagramAccountOrError {
        ... on DeleteInstagramAccountSuccess {
          success
        }

        ... on DeleteInstagramAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("deleteInstagramAccount", () => {
  describe("valid query", () => {
    const mockGravityResponse = { success: true }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        deleteInstagramAccountLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("calls loader with id", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.deleteInstagramAccountLoader as jest.Mock
      ).toHaveBeenCalledWith("ig-1")
    })

    it("returns success: true on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "deleteInstagramAccount": {
            "instagramAccountOrError": {
              "success": true,
            },
          },
        }
      `)
    })
  })

  it("returns failure on error", async () => {
    const gravityResponseBody = {
      type: "param_error",
      message: "Something went wrong.",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context = {
      deleteInstagramAccountLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteInstagramAccount": {
          "instagramAccountOrError": {
            "mutationError": {
              "message": "Something went wrong.",
            },
          },
        },
      }
    `)
  })
})
