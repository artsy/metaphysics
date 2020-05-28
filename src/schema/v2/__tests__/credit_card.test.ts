/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

xdescribe("CreditCard type", () => {
  let creditCard: any
  let context: any

  beforeEach(() => {
    creditCard = {
      id: "card123",
      brand: "Visa",
      last_digits: "4242",
    }

    context = {
      creditCardLoader: () => Promise.resolve(creditCard),
    }
  })

  it("fetches a credit card ID", () => {
    const query = `
      {
        creditCard(id: "card123") {
          internalID
          brand
          lastDigits
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data!.creditCard.internalID).toBe("card123")
      expect(data!.creditCard.brand).toBe("Visa")
      expect(data!.creditCard.lastDigits).toBe("4242")
    })
  })
})
