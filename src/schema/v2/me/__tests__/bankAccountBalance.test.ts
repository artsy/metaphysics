/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("BankAccountBalance", () => {
  it("returns bank account balance when using bankAccountId", async () => {
    const mockMeBankAccountBalanceLoader = jest
      .fn()
      .mockResolvedValue({ balance_cents: 50000, currency_code: "USD" })

    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountBalanceLoader: mockMeBankAccountBalanceLoader,
    }

    const query = gql`
      {
        me {
          bankAccountBalance(bankAccountId: "bank-123") {
            balanceCents
            currencyCode
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      me: {
        bankAccountBalance: {
          balanceCents: 50000,
          currencyCode: "USD",
        },
      },
    })

    expect(mockMeBankAccountBalanceLoader).toHaveBeenCalledWith({
      bank_account_id: "bank-123",
    })
  })

  it("returns bank account balance when using confirmationTokenId", async () => {
    const mockMeBankAccountBalanceLoader = jest
      .fn()
      .mockResolvedValue({ balance_cents: 75000, currency_code: "EUR" })

    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountBalanceLoader: mockMeBankAccountBalanceLoader,
    }

    const query = gql`
      {
        me {
          bankAccountBalance(confirmationTokenId: "token-456") {
            balanceCents
            currencyCode
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      me: {
        bankAccountBalance: {
          balanceCents: 75000,
          currencyCode: "EUR",
        },
      },
    })

    expect(mockMeBankAccountBalanceLoader).toHaveBeenCalledWith({
      confirmation_token_id: "token-456",
    })
  })

  it("returns null when loader is not available", async () => {
    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountBalanceLoader: undefined,
    }

    const query = gql`
      {
        me {
          bankAccountBalance(bankAccountId: "bank-123") {
            balanceCents
            currencyCode
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      me: {
        bankAccountBalance: null,
      },
    })
  })

  it("handles loader errors gracefully", async () => {
    const mockMeBankAccountBalanceLoader = jest
      .fn()
      .mockRejectedValue(new Error("Failed to fetch balance"))

    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountBalanceLoader: mockMeBankAccountBalanceLoader,
    }

    const query = gql`
      {
        me {
          bankAccountBalance(bankAccountId: "bank-123") {
            balanceCents
            currencyCode
          }
        }
      }
    `

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Failed to fetch balance"
    )
  })

  it("throws error when both bankAccountId and confirmationTokenId are provided", async () => {
    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountBalanceLoader: jest.fn(),
    }

    const query = gql`
      {
        me {
          bankAccountBalance(
            bankAccountId: "bank-123"
            confirmationTokenId: "token-456"
          ) {
            balanceCents
            currencyCode
          }
        }
      }
    `

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Only one of bankAccountId or confirmationTokenId should be provided"
    )
  })

  it("throws error when neither bankAccountId nor confirmationTokenId is provided", async () => {
    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountBalanceLoader: jest.fn(),
    }

    const query = gql`
      {
        me {
          bankAccountBalance {
            balanceCents
            currencyCode
          }
        }
      }
    `

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Either bankAccountId or confirmationTokenId must be provided"
    )
  })
})
