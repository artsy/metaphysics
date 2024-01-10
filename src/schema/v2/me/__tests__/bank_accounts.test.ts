/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("BankAccounts", () => {
  it("returns a bank account connection", () => {
    const bankAccounts = [
      { id: "12345", last4: "4321", type: "us_bank_account" },
      { id: "6789", last4: "9876", type: "us_bank_account" },
    ]
    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountsLoader: () =>
        Promise.resolve({
          body: bankAccounts,
          headers: { "x-total-count": "2" },
        }),
    }
    const query = gql`
      {
        me {
          bankAccounts(first: 1) {
            edges {
              node {
                internalID
                last4
                type
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
              type: "US_BANK_ACCOUNT",
            },
          },
        ],
        pageInfo: {
          hasNextPage: true,
        },
      })
    })
  })

  it("loader receives bank account type", () => {
    const bankAccounts = [{ id: "12345", last4: "4321" }]

    const mockMeBankAccountsLoader = jest.fn().mockResolvedValue({
      body: bankAccounts,
      headers: { "x-total-count": "1" },
    })

    const context = {
      meLoader: () => Promise.resolve({}),
      meBankAccountsLoader: mockMeBankAccountsLoader,
    }

    const query = gql`
      {
        me {
          bankAccounts(first: 1, type: US_BANK_ACCOUNT) {
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
    return runAuthenticatedQuery(query, context).then(() => {
      expect(mockMeBankAccountsLoader).toBeCalledWith({
        page: 1,
        size: 1,
        total_count: true,
        type: "us_bank_account",
      })
    })
  })
})
