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
      me {
        name
      }
      userInterestsOrErrors {
        ... on UserInterest {
          category
          interest {
            ... on Artist {
              name
            }
          }
        }
        ... on CreateUserInterestFailure {
          mutationError {
            type
            message
          }
        }
      }
    }
  }
  `

  const meCreateUserInterestLoader = jest.fn(async () => ({
    category: "collected_before",
    interest: {
      birthday: "10.10.2000", // without birthday it resolves to GeneType
      name: "Artist Name",
    },
  }))
  const meLoader = jest.fn(async () => ({
    id: "some-user-id",
    name: "John Doe",
  }))

  const context = {
    meCreateUserInterestLoader,
    meLoader,
  }

  it("returns the list of all the created user_interests", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "createUserInterests": {
          "me": {
            "name": "John Doe",
          },
          "userInterestsOrErrors": [
            {
              "category": "COLLECTED_BEFORE",
              "interest": {
                "name": "Artist Name",
              },
            },
            {
              "category": "COLLECTED_BEFORE",
              "interest": {
                "name": "Artist Name",
              },
            },
          ],
        },
      }
    `)

    expect(meLoader).toHaveBeenCalledWith()

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
