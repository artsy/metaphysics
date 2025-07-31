import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

let context

describe("ConfirmationToken", () => {
  beforeEach(() => {
    context = {
      stripeConfirmationTokenLoader: jest.fn(),
      meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
    }
  })

  it("returns the card details from the confirmation token", async () => {
    const query = gql`
      query {
        me {
          confirmationToken(id: "tok_123456789") {
            paymentMethodPreview {
              ... on Card {
                type
                displayBrand
                last4
              }
            }
          }
        }
      }
    `

    const mockResponse = {
      payment_method_preview: {
        type: "card",
        card: {
          display_brand: "Visa",
          last4: "4242",
        },
      },
    }

    context.stripeConfirmationTokenLoader.mockResolvedValue(mockResponse)

    const result = await runAuthenticatedQuery(query, context)

    expect(result).toEqual({
      me: {
        confirmationToken: {
          paymentMethodPreview: {
            type: "card",
            displayBrand: "Visa",
            last4: "4242",
          },
        },
      },
    })
  })

  it("throws an error if the loader is not available", async () => {
    const query = gql`
      query {
        me {
          confirmationToken(id: "tok_123456789") {
            paymentMethodPreview {
              ... on Card {
                type
                displayBrand
                last4
              }
            }
          }
        }
      }
    `

    context.stripeConfirmationTokenLoader = null

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "You need to be authenticated to perform this action."
    )
  })

  it("throws an error if the loader fails", async () => {
    const query = gql`
      query {
        me {
          confirmationToken(id: "tok_123456789") {
            paymentMethodPreview {
              ... on Card {
                type
                displayBrand
                last4
              }
            }
          }
        }
      }
    `

    context.stripeConfirmationTokenLoader.mockRejectedValue(
      new Error("Failed to fetch confirmation token")
    )

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Failed to fetch confirmation token"
    )
  })

  it("returns the US bank account details from the confirmation token", async () => {
    const query = gql`
      query {
        me {
          confirmationToken(id: "tok_123456789") {
            paymentMethodPreview {
              ... on USBankAccount {
                type
                bankName
                last4
              }
            }
          }
        }
      }
    `

    const mockResponse = {
      payment_method_preview: {
        type: "us_bank_account",
        us_bank_account: {
          bank_name: "Chase Bank",
          last4: "6789",
        },
      },
    }

    context.stripeConfirmationTokenLoader.mockResolvedValue(mockResponse)

    const result = await runAuthenticatedQuery(query, context)

    expect(result).toEqual({
      me: {
        confirmationToken: {
          paymentMethodPreview: {
            type: "us_bank_account",
            bankName: "Chase Bank",
            last4: "6789",
          },
        },
      },
    })
  })

  it("returns the SEPA debit details from the confirmation token", async () => {
    const query = gql`
      query {
        me {
          confirmationToken(id: "tok_123456789") {
            paymentMethodPreview {
              ... on SEPADebit {
                type
                last4
              }
            }
          }
        }
      }
    `

    const mockResponse = {
      payment_method_preview: {
        type: "sepa_debit",
        sepa_debit: {
          last4: "1234",
        },
      },
    }

    context.stripeConfirmationTokenLoader.mockResolvedValue(mockResponse)

    const result = await runAuthenticatedQuery(query, context)

    expect(result).toEqual({
      me: {
        confirmationToken: {
          paymentMethodPreview: {
            type: "sepa_debit",
            last4: "1234",
          },
        },
      },
    })
  })
})
