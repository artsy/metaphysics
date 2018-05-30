import { runAuthenticatedQuery } from "test/utils"

describe("Credit card mutation", () => {
  const creditCard = {
    id: "foo-foo",
    _id: "123",
    name: "Foo User",
    last_digits: "1234",
    expiration_month: 3,
    expiration_year: 2018,
  }

  const query = `
  mutation {
    createCreditCard(input: {token: "123abc"}) {
      credit_card {
        name
        last_digits
        expiration_month
        expiration_year
      }
    }
  }
  `

  const rootValue = {
    createCreditCardLoader: () => {return Promise.resolve(creditCard)},
  }

  it("creates a credit card", async () =>
    {return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        createCreditCard: {
          credit_card: {
            name: "Foo User",
            last_digits: "1234",
            expiration_month: 3,
            expiration_year: 2018,
          },
        },
      })
    })})
})
