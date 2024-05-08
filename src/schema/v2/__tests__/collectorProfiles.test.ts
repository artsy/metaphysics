// eslint-disable jest/no-try-expect

import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("collectorProfilesConnection", () => {
  const query = gql`
    {
      collectorProfilesConnection(
        first: 5
        partnerID: "test-id"
        term: "test"
      ) {
        totalCount
        edges {
          node {
            name
          }
        }
      }
    }
  `

  const collectorProfilesLoader = jest.fn(() =>
    Promise.resolve({
      body: [{ name: "Example Profile 1" }, { name: "Example Profile 2" }],
      headers: { "x-total-count": "2" },
    })
  )

  afterEach(() => {
    collectorProfilesLoader.mockClear()
  })

  it("returns a connection", async () => {
    const { collectorProfilesConnection } = await runQuery(query, {
      collectorProfilesLoader,
    })

    expect(collectorProfilesConnection.totalCount).toBe(2)
    expect(collectorProfilesConnection.edges).toEqual([
      { node: { name: "Example Profile 1" } },
      { node: { name: "Example Profile 2" } },
    ])
  })

  it("passes args to gravity", async () => {
    await runQuery(query, { collectorProfilesLoader })

    expect(collectorProfilesLoader).toBeCalledTimes(1)
    expect(collectorProfilesLoader).toBeCalledWith({
      size: 5,
      offset: 0,
      total_count: true,
      inquired_partner_id: "test-id",
      name_contains: "test",
    })
  })

  it("returns an error partnerID argument is missing", async () => {
    const missingArgsQuery = gql`
      {
        collectorProfilesConnection(first: 5) {
          totalCount
        }
      }
    `

    try {
      await runQuery(missingArgsQuery, { collectorProfilesLoader })
      throw new Error("An error was not thrown but was expected.")
    } catch (error) {
      /* eslint-disable jest/no-conditional-expect */
      /* eslint-disable jest/no-try-expect */
      expect(error.message).toEqual("Argument `partnerID` is required.")
    }
  })

  it("returns an error term argument is missing", async () => {
    const missingArgsQuery = gql`
      {
        collectorProfilesConnection(first: 5, partnerID: "test-id") {
          totalCount
        }
      }
    `

    try {
      await runQuery(missingArgsQuery, { collectorProfilesLoader })
      throw new Error("An error was not thrown but was expected.")
    } catch (error) {
      /* eslint-disable jest/no-conditional-expect */
      /* eslint-disable jest/no-try-expect */
      expect(error.message).toEqual("Argument `term` is required.")
    }
  })

  it("returns the data when term is ''", async () => {
    const query = gql`
      {
        collectorProfilesConnection(first: 5, partnerID: "test-id", term: "") {
          totalCount
        }
      }
    `

    const { collectorProfilesConnection } = await runQuery(query, {
      collectorProfilesLoader,
    })

    expect(collectorProfilesConnection.totalCount).toBe(2)
  })
})
