import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("Invoice", () => {
  it("fetches invoice by token and matches snapshot", async () => {
    const invoicesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        number: 25173,
        state: "ready",
        ready_at: "2024-10-12T00:00:00Z",
        name: "Percy Z",
        email: "percy.z@example.com",
        line_items: [
          {
            subtotal_cents: 50000,
            description: "Artwork Purchase",
            quantity: 1,
          },
        ],
        payments: [
          {
            successful: true,
            created_at: "2024-10-13T00:00:00Z",
            amount_cents: 50000,
            credit_card: {
              last_digits: "1234",
              brand: "Visa",
            },
          },
        ],
        remaining_cents: 0,
        external_note: "Thank you for your purchase",
        currency: "USD",
      })
    )

    const query = gql`
      {
        invoice(token: "invoice-token") {
          number
          state
          readyAt
          name
          email
          lineItems {
            description
            subtotal
            quantity
          }
          payments {
            successful
            createdAt
            amount
            creditCard {
              lastDigits
              brand
            }
          }
          remaining
          externalNote
          currency
        }
      }
    `

    const { invoice } = await runQuery(query, { invoicesLoader })

    expect(invoice).toMatchSnapshot()
  })
})
