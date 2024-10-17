/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("CreditCard type", () => {
  let creditCard: any
  let context: any

  beforeEach(() => {
    creditCard = {
      id: "card123",
      brand: "Visa",
      last_digits: "4242",
      preferred_network: null,
    }

    context = {
      creditCardLoader: () => Promise.resolve(creditCard),
    }
  })

  it("fetches a credit card ID", async () => {
    const query = `
      {
        creditCard(id: "card123") {
          internalID
          brand
          lastDigits
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data!.creditCard.internalID).toBe("card123")
    expect(data!.creditCard.brand).toBe("Visa")
    expect(data!.creditCard.lastDigits).toBe("4242")
  })

  it("returns card brand directly when preferred network unavailable", async () => {
    const query = `
      {
        creditCard(id: "card123") {
          brand
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data!.creditCard.brand).toBe("Visa")
  })

  it("returns preferred network as card brand when available", async () => {
    creditCard = {
      id: "card123",
      brand: "Visa",
      last_digits: "4242",
      preferred_network: "Cartes Bancaires",
    }

    context = {
      creditCardLoader: () => Promise.resolve(creditCard),
    }

    const query = `
      {
        creditCard(id: "card123") {
          brand
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data!.creditCard.brand).toBe("Cartes Bancaires")
  })
})
