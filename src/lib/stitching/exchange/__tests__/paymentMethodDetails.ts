import gql from "lib/gql"
import { Response } from "node-fetch"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
const mockFetch = require("../link").mockFetch as jest.Mock<any>

describe("paymentMethodDetails", () => {
  const creditCard = {
    last_digits: "5309",
    brand: "American Express",
  }

  const bankAccount = {
    last4: "4242",
    bank_name: "1st National",
    account_holder_name: "Joe Pennies",
  }

  const creditCardLoader = jest.fn(() => Promise.resolve(creditCard))
  const bankAccountLoader = jest.fn(() => Promise.resolve(bankAccount))

  const context: Partial<ResolverContext> = {
    creditCardLoader,
    bankAccountLoader,
  }
  const query = gql`
    query {
      commerceOrder(code: "abc") {
        paymentMethodDetails {
          __typename
          ... on CreditCard {
            lastDigits
            brand
          }
          ... on BankAccount {
            last4
            bankName
            accountHolderName
          }
          ... on WireTransfer {
            isManualPayment
          }
        }
      }
    }
  `

  it("returns the credit card object when the payment method is a credit card", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify(
            orderFixture({ paymentMethod: "CREDIT_CARD", creditCardId: "asdf" })
          )
        )
      )
    })
    const result = await runQuery(query, context)

    expect(result.commerceOrder.paymentMethodDetails.brand).toEqual(
      "American Express"
    )
    expect(result.commerceOrder.paymentMethodDetails.lastDigits).toEqual("5309")
    expect(result.commerceOrder.paymentMethodDetails.__typename).toEqual(
      "CreditCard"
    )
  })

  it("returns the bank account object when the payment method is a us_bank_account", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify(
            orderFixture({
              paymentMethod: "US_BANK_ACCOUNT",
              bankAccountId: "1234",
            })
          )
        )
      )
    })
    const result = await runQuery(query, context)

    expect(result.commerceOrder.paymentMethodDetails.bankName).toEqual(
      "1st National"
    )
    expect(result.commerceOrder.paymentMethodDetails.last4).toEqual("4242")
    expect(result.commerceOrder.paymentMethodDetails.accountHolderName).toEqual(
      "Joe Pennies"
    )
    expect(result.commerceOrder.paymentMethodDetails.__typename).toEqual(
      "BankAccount"
    )
  })

  it("returns the generic wire transfer type when the payment method is a wire_transfer", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify(orderFixture({ paymentMethod: "WIRE_TRANSFER" }))
        )
      )
    })
    const result = await runQuery(query, context)

    expect(result.commerceOrder.paymentMethodDetails.isManualPayment).toBe(true)
    expect(result.commerceOrder.paymentMethodDetails.__typename).toEqual(
      "WireTransfer"
    )
  })
})

const orderFixture = (overrides: Record<string, any> = {}) => {
  return {
    data: {
      order: {
        __typename: "BuyOrder",
        id: "fooid123",
        code: "1",
        state: "PENDING",
        stateReason: null,
        currencyCode: "usd",
        mode: "BUY",
        seller: {
          id: "111",
          __typename: "Partner",
        },
        buyer: {
          id: "111",
          __typename: "User",
        },
        requestedFulfillment: {
          __typename: "Ship",
          name: "Dr Collector",
          addressLine1: "Vanak 123",
          addressLine2: "P 80",
          city: "Tehran",
          region: "Tehran",
          country: "IR",
          postalCode: "09821",
          phoneNumber: "093929821",
        },
        buyerPhoneNumber: "093929821",
        itemsTotalCents: "420000",
        totalListPriceCents: "421000",
        shippingTotalCents: "420100",
        taxTotalCents: "420200",
        commissionFeeCents: "420300",
        transactionFeeCents: "420400",
        buyerTotalCents: "800000",
        sellerTotalCents: "890000",
        updatedAt: "2018-07-03 17:57:47 UTC",
        createdAt: "2018-07-03 17:57:47 UTC",
        stateUpdatedAt: "2018-07-03 17:57:47 UTC",
        stateExpiresAt: "2018-07-03 17:57:47 UTC",
        lastApprovedAt: "2018-04-03 17:57:47 UTC",
        lastSubmittedAt: "2018-03-03 17:57:47 UTC",
        lineItems: {
          edges: [
            {
              node: {
                id: "1",
                priceCents: 420000,
                listPriceCents: 420000,
                artworkId: "541324567261693f97790b00",
                artworkVersionId: "OMGHAHA",
                artistId: "222",
                editionSetId: null,
                quantity: 1,
                fulfillments: {
                  edges: [
                    {
                      node: {
                        id: "f-1",
                        courier: "fedEx",
                        trackingId: "track1",
                        estimatedDelivery: "2018-05-18",
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        ...overrides,
      },
    },
  }
}
