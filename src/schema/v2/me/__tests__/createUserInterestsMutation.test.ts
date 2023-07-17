import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createUserInterestsMutation", () => {
  const mutation = `
  mutation {
    createUserInterests(
      input: {
        userInterests: [
          {
            category: COLLECTED_BEFORE
            interestId: "interest-id-1"
            interestType: ARTIST
            private: true
          },
          {
            category: COLLECTED_BEFORE
            interestId: "interest-id-2"
            interestType: ARTIST
            private: false
          }
        ]
      }
    ) {
      userInterestsOrError {
        ... on createUserInterestsSuccess {
          userInterests {
            category
            interest {
              ... on Artist {
                name
              }
            }
          }
        }
      }
    }
  }
  `

  const userInterest = {
    category: "collected_before",
    interest: {
      birthday: "10.10.2000", // without birthday it resolves to GeneType
      name: "Artist Name",
    },
  }

  const meCreateUserInterestLoader = jest.fn(async () => userInterest)

  const context = {
    meCreateUserInterestLoader,
  }

  it("returns the list of all the created user_interests", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      Object {
        "createUserInterests": Object {
          "userInterestsOrError": Object {
            "userInterests": Array [
              Object {
                "category": "COLLECTED_BEFORE",
                "interest": Object {
                  "name": "Artist Name",
                },
              },
              Object {
                "category": "COLLECTED_BEFORE",
                "interest": Object {
                  "name": "Artist Name",
                },
              },
            ],
          },
        },
      }
    `)

    expect(meCreateUserInterestLoader).toHaveBeenCalledTimes(2)
    expect(meCreateUserInterestLoader).toHaveBeenCalledWith({
      category: "collected_before",
      interest_id: "interest-id-1",
      interest_type: "Artist",
      private: true,
    }) // first call
    expect(meCreateUserInterestLoader).toHaveBeenCalledWith({
      category: "collected_before",
      interest_id: "interest-id-2",
      interest_type: "Artist",
      private: false,
    }) // second call
  })
})
