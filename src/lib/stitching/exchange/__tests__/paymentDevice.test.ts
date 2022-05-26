import gql from "lib/gql"
import { Response } from "node-fetch"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
const mockFetch = require("../link").mockFetch as jest.Mock<any>

describe("paymentDevice", () => {
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
        paymentDevice {
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
          ... on ManualWirePayment {
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
            orderFixture({ paymentMethod: "credit card", creditCardId: "asdf" })
          )
        )
      )
    })
    const result = await runQuery(query, context)

    expect(result.commerceOrder.paymentDevice.brand).toEqual("American Express")
    expect(result.commerceOrder.paymentDevice.lastDigits).toEqual("5309")
    expect(result.commerceOrder.paymentDevice.__typename).toEqual("CreditCard")
  })

  it("returns the bank account object when the payment method is a us_bank_account", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify(
            orderFixture({
              paymentMethod: "us_bank_account",
              bankAccountId: "1234",
            })
          )
        )
      )
    })
    const result = await runQuery(query, context)

    expect(result.commerceOrder.paymentDevice.bankName).toEqual("1st National")
    expect(result.commerceOrder.paymentDevice.last4).toEqual("4242")
    expect(result.commerceOrder.paymentDevice.accountHolderName).toEqual(
      "Joe Pennies"
    )
    expect(result.commerceOrder.paymentDevice.__typename).toEqual("BankAccount")
  })

  it("returns the generic wire transfer type when the payment method is a wire_transfer", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify(orderFixture({ paymentMethod: "wire_transfer" }))
        )
      )
    })
    const result = await runQuery(query, context)

    expect(result.commerceOrder.paymentDevice.isManualPayment).toBe(true)
    expect(result.commerceOrder.paymentDevice.__typename).toEqual(
      "ManualWirePayment"
    )
  })

  //   it("returns the price when the line item is a single edition set", async () => {
  //     mockFetch.mockImplementationOnce(() => {
  //       return Promise.resolve(
  //         new Response(JSON.stringify(editionSetOrderFixture))
  //       )
  //     })
  //     const result = await runQuery(query, context)
  //     expect(
  //       result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet.price
  //     ).toEqual("$5,000")

  //     expect(
  //       result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
  //         .displayPriceRange
  //     ).toEqual(false)
  //   })

  //   it("returns the price when the line item is an edition set of multiple", async () => {
  //     mockFetch.mockImplementationOnce(() => {
  //       return Promise.resolve(
  //         new Response(JSON.stringify(editionSetOrderFixture))
  //       )
  //     })

  //     artworkLoader.mockResolvedValueOnce({
  //       price: "$3,000 - 10,000",
  //       edition_sets: [
  //         {
  //           id: "abc123",
  //           price: "$3,000",
  //           display_price_range: false,
  //         },
  //         {
  //           id: "hello",
  //           price: "$10,000",
  //           display_price_range: false,
  //         },
  //       ],
  //     })

  //     const result = await runQuery(query, context)
  //     expect(
  //       result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet.price
  //     ).toEqual("$3,000")

  //     expect(
  //       result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
  //         .displayPriceRange
  //     ).toEqual(false)
  //   })

  //   it("doesn't fail if the edition set no longer exists", async () => {
  //     mockFetch.mockImplementationOnce(() => {
  //       return Promise.resolve(
  //         new Response(JSON.stringify(editionSetOrderFixture))
  //       )
  //     })

  //     artworkLoader.mockResolvedValueOnce({
  //       price: "$3,000 - 10,000",
  //       edition_sets: [
  //         {
  //           id: "nomatch1",
  //           price: "$3,000",
  //         },
  //         {
  //           id: "nomatch2",
  //           price: "$10,000",
  //         },
  //       ],
  //     })

  //     const result = await runQuery(query, context)
  //     expect(
  //       result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
  //     ).toEqual(null)
  //   })
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

// const editionSetOrderFixture = merge(orderFixture, {
//   data: {
//     order: {
//       lineItems: {
//         edges: [
//           {
//             node: {
//               ...orderFixture.data.order.lineItems.edges[0].node,
//               editionSetId: "abc123",
//             },
//           },
//         ],
//       },
//     },
//   },
// })
