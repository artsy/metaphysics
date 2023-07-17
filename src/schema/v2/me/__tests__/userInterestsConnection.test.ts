import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { userInterestFixture } from "../userInterestFixture"

describe("Me", () => {
  describe("UserInterestsConnection", () => {
    const query = gql`
      {
        me {
          name
          userInterestsConnection(
            category: COLLECTED_BEFORE
            interestType: ARTIST
            first: 10
            page: 2
          ) {
            edges {
              category
              node {
                ... on Artist {
                  name
                }
              }
            }
          }
        }
      }
    `

    const meLoader = jest.fn(() => ({
      name: "Long John",
    }))
    const meUserInterestsLoader = jest.fn(async () => ({
      headers: { "x-total-count": 30 },
      body: [userInterestFixture, userInterestFixture],
    }))

    const context = {
      meLoader,
      meUserInterestsLoader,
    }

    it("returns user's artist user_interests", async () => {
      const result = await runAuthenticatedQuery(query, context)

      expect(result).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "name": "Long John",
            "userInterestsConnection": Object {
              "edges": Array [
                Object {
                  "category": "COLLECTED_BEFORE",
                  "node": Object {
                    "name": "Yayoi Kusama",
                  },
                },
                Object {
                  "category": "COLLECTED_BEFORE",
                  "node": Object {
                    "name": "Yayoi Kusama",
                  },
                },
              ],
            },
          },
        }
      `)

      expect(meUserInterestsLoader).toHaveBeenCalledWith({
        category: "collected_before",
        interest_type: "Artist",
        page: 2,
        size: 10,
        total_count: true,
      })
    })
  })
})
