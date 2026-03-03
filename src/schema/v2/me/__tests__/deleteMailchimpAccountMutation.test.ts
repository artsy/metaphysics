import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    deleteMailchimpAccount(input: { id: "mc-1" }) {
      mailchimpAccountOrError {
        ... on DeleteMailchimpAccountSuccess {
          success
        }

        ... on DeleteMailchimpAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("deleteMailchimpAccount", () => {
  describe("valid query", () => {
    const mockGravityResponse = { success: true }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        deleteMailchimpAccountLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("calls loader with id", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.deleteMailchimpAccountLoader as jest.Mock
      ).toHaveBeenCalledWith("mc-1")
    })

    it("returns success: true on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "deleteMailchimpAccount": {
            "mailchimpAccountOrError": {
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
      deleteMailchimpAccountLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteMailchimpAccount": {
          "mailchimpAccountOrError": {
            "mutationError": {
              "message": "Something went wrong.",
            },
          },
        },
      }
    `)
  })
})
