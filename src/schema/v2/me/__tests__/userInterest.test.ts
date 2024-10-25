import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.userInterest", () => {
  it("returns user interest", async () => {
    const query = gql`
      {
        me {
          userInterest(id: "user-interest-id") {
            internalID
            interest {
              __typename
              ... on Artist {
                internalID
                name
              }
            }
          }
        }
      }
    `
    const meUserInterestLoader = jest.fn(async () => ({
      interest: {
        _id: "artist-id",
        name: "Artist Name",
        id: "yayoi-kusama",
        birthday: "10.10.2002",
      },
      id: "user-interest-id",
    }))
    const meLoader = jest.fn(async () => ({ id: "some-user-id" }))

    const context: Partial<ResolverContext> = {
      meUserInterestLoader,
      meLoader,
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(meLoader).toHaveBeenCalled()
    expect(meUserInterestLoader).toHaveBeenCalledWith("user-interest-id")

    expect(data).toMatchInlineSnapshot(`
      {
        "me": {
          "userInterest": {
            "interest": {
              "__typename": "Artist",
              "internalID": "artist-id",
              "name": "Artist Name",
            },
            "internalID": "user-interest-id",
          },
        },
      }
    `)
  })
})
