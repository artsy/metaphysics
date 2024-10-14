import { runQuery } from "schema/v2/test/utils"

describe("Mutation createInvoicePayment", () => {
  it("creates an invoice payment", async () => {
    const mutation = `
      mutation {
        createInvoicePayment(input: { invoiceID: "1234", amountMinor: 100, creditCardToken: "foo", invoiceToken: "bar", provider: "stripe" }) {
          responseOrError {
            __typename
            ... on CreateInvoicePaymentSuccess {
              invoicePayment {
                amount
                successful
              }
            }
          }
        }
      }
    `

    const context = {
      createInvoicePaymentLoader: jest.fn().mockReturnValueOnce(
        Promise.resolve({
          id: "1234",
          amount_cents: 100,
          successful: true,
        })
      ),
    }

    const data = await runQuery(mutation, context)
    expect(data).toEqual({
      createInvoicePayment: {
        responseOrError: {
          __typename: "CreateInvoicePaymentSuccess",
          invoicePayment: {
            amount: "$1",
            successful: true,
          },
        },
      },
    })
  })
})
