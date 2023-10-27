import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("UserInterestsConnection", () => {
    it("returns user's artist user_interests", async () => {
      const query = gql`
        {
          me {
            name
            userInterestsConnection(
              category: COLLECTED_BEFORE
              interestType: ARTIST
              first: 10
            ) {
              edges {
                internalID
                node {
                  ... on Artist {
                    internalID
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
        body: [
          {
            interest: {
              _id: "artist-id-1",
              name: "Artist Name 1",
              id: "yayoi-kusama",
              birthday: "10.10.2002",
            },
            id: "user-interest-id-1",
          },
          {
            interest: {
              _id: "artist-id-2",
              name: "Artist Name 2",
              id: "yayoi-kusama",
              birthday: "10.10.2002",
            },
            id: "user-interest-id-2",
          },
        ],
      }))

      const context = {
        meLoader,
        meUserInterestsLoader,
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "name": "Long John",
            "userInterestsConnection": Object {
              "edges": Array [
                Object {
                  "internalID": "user-interest-id-1",
                  "node": Object {
                    "internalID": "artist-id-1",
                    "name": "Artist Name 1",
                  },
                },
                Object {
                  "internalID": "user-interest-id-2",
                  "node": Object {
                    "internalID": "artist-id-2",
                    "name": "Artist Name 2",
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
        page: 1,
        size: 10,
        total_count: true,
        user_id: "user-42",
      })
    })

    it("sends interest id when provided", async () => {
      const query = gql`
        {
          me {
            name
            userInterestsConnection(
              category: COLLECTED_BEFORE
              interestType: ARTIST
              first: 10
              interestID: "artist-id-1"
            ) {
              edges {
                internalID
                node {
                  ... on Artist {
                    internalID
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
        body: [
          {
            interest: {
              _id: "artist-id-1",
              name: "Artist Name 1",
              id: "yayoi-kusama",
              birthday: "10.10.2002",
            },
            id: "user-interest-id-1",
          },
        ],
      }))

      const context = {
        meLoader,
        meUserInterestsLoader,
      }

      await runAuthenticatedQuery(query, context)

      expect(meUserInterestsLoader).toHaveBeenCalledWith({
        category: "collected_before",
        interest_type: "Artist",
        interest_id: "artist-id-1",
        page: 1,
        size: 10,
        total_count: true,
        user_id: "user-42",
      })
    })
  })
})
