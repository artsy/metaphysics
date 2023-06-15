import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("artistTypeUserInterests", () => {
    const query = gql`
      {
        me {
          name
          artistTypeUserInterestsConnection(
            category: COLLECTED_BEFORE
            first: 10
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

    const userInterest1 = {
      category: "collected_before",
      interest: { name: "Banksy", birthday: "10.10.2002" },
    }
    const userInterest2 = {
      category: "collected_before",
      interest: { name: "Kaws", birthday: "10.10.2002" },
    }
    const userInterest3 = {
      category: "collected_before",
      interest: { name: "Warhol", birthday: "10.10.2002" },
    }

    const mockMeLoader = jest.fn()
    const mockMeArtistTypeUserInterestsLoader = jest.fn()

    const context = {
      meLoader: mockMeLoader,
      meArtistTypeUserInterestsLoader: mockMeArtistTypeUserInterestsLoader,
    }

    beforeEach(() => {
      mockMeLoader.mockResolvedValue(Promise.resolve({ name: "Long John" }))

      mockMeArtistTypeUserInterestsLoader.mockResolvedValue(
        Promise.resolve({
          headers: { "x-total-count": 3 },
          body: [userInterest1, userInterest2, userInterest3],
        })
      )
    })

    it("returns user's artist user_interests", async () => {
      const res = await runAuthenticatedQuery(query, context)

      expect(res).toEqual({
        me: {
          name: "Long John",
          artistTypeUserInterestsConnection: {
            edges: [
              {
                category: "COLLECTED_BEFORE",
                node: {
                  name: "Banksy",
                },
              },
              {
                category: "COLLECTED_BEFORE",
                node: {
                  name: "Kaws",
                },
              },
              {
                category: "COLLECTED_BEFORE",
                node: {
                  name: "Warhol",
                },
              },
            ],
          },
        },
      })
    })
  })
})
