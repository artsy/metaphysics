import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("confirmPasswordMutation", () => {
  const mockConfirmPasswordLoader = jest.fn()

  const context = {
    confirmPasswordLoader: mockConfirmPasswordLoader,
  }

  afterEach(() => {
    mockConfirmPasswordLoader.mockReset()
  })

  it("confirms a valid password", async () => {
    mockConfirmPasswordLoader.mockResolvedValue({ valid: true })

    const mutation = gql`
      mutation {
        confirmPassword(input: { password: "my-password" }) {
          valid
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockConfirmPasswordLoader).toHaveBeenCalledWith({
      password: "my-password",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "confirmPassword": {
          "valid": true,
        },
      }
    `)
  })

  it("returns false for an invalid password", async () => {
    mockConfirmPasswordLoader.mockResolvedValue({ valid: false })

    const mutation = gql`
      mutation {
        confirmPassword(input: { password: "wrong-password" }) {
          valid
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockConfirmPasswordLoader).toHaveBeenCalledWith({
      password: "wrong-password",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "confirmPassword": {
          "valid": false,
        },
      }
    `)
  })

  it("throws an error if user is not authenticated", async () => {
    const unauthenticatedContext = {
      confirmPasswordLoader: undefined,
    }

    const mutation = gql`
      mutation {
        confirmPassword(input: { password: "my-password" }) {
          valid
        }
      }
    `

    await expect(
      runAuthenticatedQuery(mutation, unauthenticatedContext)
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
