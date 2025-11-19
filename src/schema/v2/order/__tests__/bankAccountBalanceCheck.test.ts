/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "./support"

describe("Order bankAccountBalanceCheck", () => {
  it("returns SUFFICIENT when balance check passes", async () => {
    const orderJson = {
      ...baseOrderJson,
      id: "order-id",
      payment_method: "us_bank_account",
      bank_account_id: "bank-123",
      buyer_total_cents: 100000,
      currency_code: "USD",
    }

    const meOrderBankAccountBalanceCheckLoader = jest.fn().mockResolvedValue({
      result: "SUFFICIENT",
      message: "Bank account has sufficient funds for this order",
    })

    const context = {
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
      meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      meOrderBankAccountBalanceCheckLoader,
    }

    const query = gql`
      query {
        me {
          order(id: "order-id") {
            internalID
            bankAccountBalanceCheck {
              result
              message
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(meOrderBankAccountBalanceCheckLoader).toHaveBeenCalledWith(
      "order-id"
    )
    expect(data).toEqual({
      me: {
        order: {
          internalID: "order-id",
          bankAccountBalanceCheck: {
            result: "SUFFICIENT",
            message: "Bank account has sufficient funds for this order",
          },
        },
      },
    })
  })

  it("returns INSUFFICIENT when balance check fails", async () => {
    const orderJson = {
      ...baseOrderJson,
      id: "order-id",
      payment_method: "us_bank_account",
      bank_account_id: "bank-123",
      buyer_total_cents: 100000,
      currency_code: "USD",
    }

    const meOrderBankAccountBalanceCheckLoader = jest.fn().mockResolvedValue({
      result: "INSUFFICIENT",
      message: "Bank account does not have sufficient funds for this order",
    })

    const context = {
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
      meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      meOrderBankAccountBalanceCheckLoader,
    }

    const query = gql`
      query {
        me {
          order(id: "order-id") {
            internalID
            bankAccountBalanceCheck {
              result
              message
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data!.me.order.bankAccountBalanceCheck.result).toEqual(
      "INSUFFICIENT"
    )
  })

  it("returns PENDING when balance is not yet available", async () => {
    const orderJson = {
      ...baseOrderJson,
      id: "order-id",
      payment_method: "us_bank_account",
      stripe_confirmation_token: "token-123",
      buyer_total_cents: 100000,
      currency_code: "USD",
    }

    const meOrderBankAccountBalanceCheckLoader = jest.fn().mockResolvedValue({
      result: "PENDING",
      message: "Balance information is not yet available, please try again",
    })

    const context = {
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
      meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      meOrderBankAccountBalanceCheckLoader,
    }

    const query = gql`
      query {
        me {
          order(id: "order-id") {
            internalID
            bankAccountBalanceCheck {
              result
              message
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data!.me.order.bankAccountBalanceCheck.result).toEqual("PENDING")
  })

  it("returns NOT_SUPPORTED for non-bank account payment methods", async () => {
    const orderJson = {
      ...baseOrderJson,
      id: "order-id",
      payment_method: "credit_card",
      buyer_total_cents: 100000,
      currency_code: "USD",
    }

    const meOrderBankAccountBalanceCheckLoader = jest.fn().mockResolvedValue({
      result: "NOT_SUPPORTED",
      message: "Balance check is only supported for US bank account payments",
    })

    const context = {
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
      meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      meOrderBankAccountBalanceCheckLoader,
    }

    const query = gql`
      query {
        me {
          order(id: "order-id") {
            internalID
            bankAccountBalanceCheck {
              result
              message
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data!.me.order.bankAccountBalanceCheck.result).toEqual(
      "NOT_SUPPORTED"
    )
  })

  it("returns INVALID when order is missing required data", async () => {
    const orderJson = {
      ...baseOrderJson,
      id: "order-id",
      payment_method: "us_bank_account",
      buyer_total_cents: 100000,
      currency_code: "USD",
    }

    const meOrderBankAccountBalanceCheckLoader = jest.fn().mockResolvedValue({
      result: "INVALID",
      message: "Order does not have a bank account or confirmation token",
    })

    const context = {
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
      meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      meOrderBankAccountBalanceCheckLoader,
    }

    const query = gql`
      query {
        me {
          order(id: "order-id") {
            internalID
            bankAccountBalanceCheck {
              result
              message
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data!.me.order.bankAccountBalanceCheck.result).toEqual("INVALID")
  })

  it("returns null when loader is not available", async () => {
    const orderJson = {
      ...baseOrderJson,
      id: "order-id",
      payment_method: "us_bank_account",
      bank_account_id: "bank-123",
      buyer_total_cents: 100000,
      currency_code: "USD",
    }

    const context = {
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
      meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      meOrderBankAccountBalanceCheckLoader: undefined,
    }

    const query = gql`
      query {
        me {
          order(id: "order-id") {
            internalID
            bankAccountBalanceCheck {
              result
              message
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data!.me.order.bankAccountBalanceCheck).toBeNull()
  })
})
