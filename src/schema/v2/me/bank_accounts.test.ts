/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("BankAccounts", () => {
  it("returns a bank account connection", () => {
    const bankAccounts = [
      { id: "12345", last4: "4321" },
      { id: "6789", last4: "9876" },
    ]
    const context = {
      meLoader: () =>
        Promise.resolve({}),
      meBankAccountsLoader: () =>
        Promise.resolve({
          body: bankAccounts,
          headers: { "x-total-count": "2" },
        })
    }
    const query = gql`
      {
        me {
          bankAccounts(first: 1) {
            edges {
              node {
                internalID
                last4
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    expect.assertions(1)
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(data!.me.bankAccounts).toEqual({
        edges: [
          {
            node: {
              internalID: "12345",
              last4: "4321",
            },
          },
        ],
        pageInfo: {
          hasNextPage: true,
        },
      })
    })
  })
})
