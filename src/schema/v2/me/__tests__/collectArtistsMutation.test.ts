import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("collectArtistsMutation", () => {
  const mutation = `
  mutation {
    collectArtists(input: { artistIDs: ["artist_id_1", "artist_id_2"] }) {
      userInterestsOrError {
        ... on collectArtistsSuccess {
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

  const mockMeCreateUserInterestLoader = jest.fn()

  const context = {
    meCreateUserInterestLoader: mockMeCreateUserInterestLoader,
  }

  beforeEach(() => {
    mockMeCreateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockMeCreateUserInterestLoader.mockReset()
  })

  it("returns the list of all the created user_interests", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toEqual({
      collectArtists: {
        userInterestsOrError: {
          userInterests: [
            { category: "COLLECTED_BEFORE", interest: { name: "Artist Name" } },
            { category: "COLLECTED_BEFORE", interest: { name: "Artist Name" } },
          ],
        },
      },
    })
  })

  it("calls the loader with all the provided artistIDs", async () => {
    await runAuthenticatedQuery(mutation, context)

    const commonArgs = { category: "collected_before", interest_type: "Artist" }

    expect(mockMeCreateUserInterestLoader).toHaveBeenCalledTimes(2)
    expect(mockMeCreateUserInterestLoader).toHaveBeenNthCalledWith(1, {
      ...commonArgs,
      interest_id: "artist_id_1",
    })
    expect(mockMeCreateUserInterestLoader).toHaveBeenNthCalledWith(2, {
      ...commonArgs,
      interest_id: "artist_id_2",
    })
  })
})
