import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Delete card mutation", () => {
  const bankAccount = {
    id: "123",
    account_holder_name: "Foo User",
    bank_name: "Test bank",
    last4: "1234",
  }

  const query = `
  mutation {
    deleteBankAccount(input: {id: "foo-foo"}) {
      bankAccountOrError {
        ... on BankAccountMutationSuccess {
          bankAccount {
            internalID
          }
        }
        ... on BankAccountMutationFailure {
          mutationError {
            type
            message
            detail
          }
        }
      }
    }
  }
  `

  const context = {
    deleteBankAccountLoader: () => Promise.resolve(bankAccount),
  }

  it("deletes a bank account with an error message", async () => {
    const errorRootValue = {
      deleteBankAccountLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/me/bank_accounts?id=foo - {"error":"Card Not Found"}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(query, errorRootValue)
    expect(data).toEqual({
      deleteBankAccount: {
        bankAccountOrError: {
          mutationError: {
            detail: null,
            message: "Card Not Found",
            type: "error",
          },
        },
      },
    })
  })

  it("throws an error if there is one we don't recognize", async () => {
    const errorRootValue = {
      deleteBankAccountLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    expect.assertions(1)

    await expect(runAuthenticatedQuery(query, errorRootValue)).rejects.toThrow(
      "ETIMEOUT service unreachable"
    )
  })

  it("deletes a bank account successfully", async () => {
    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      deleteBankAccount: {
        bankAccountOrError: { bankAccount: { internalID: "123" } },
      },
    })
  })
})
