/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("CreditCard type", () => {
  let creditCard: any
  let rootValue: any

  beforeEach(() => {
    creditCard = {
      id: "card123",
      brand: "Visa",
      last_digits: "4242",
    }

    rootValue = {
      creditCardLoader: () => Promise.resolve(creditCard),
    }
  })

  it("fetches a credit card ID", () => {
    const query = `
      {
        credit_card(id: "card123") {
          id
          brand
          last_digits
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data!.credit_card.id).toBe("card123")
      expect(data!.credit_card.brand).toBe("Visa")
      expect(data!.credit_card.last_digits).toBe("4242")
    })
  })
})
