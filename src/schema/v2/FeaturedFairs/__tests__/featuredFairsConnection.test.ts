import gql from "lib/gql"
import { range } from "lodash"
import moment from "moment"
import { runQuery } from "schema/v2/test/utils"

describe("featuredFairsConnection", () => {
  const query = gql`
    {
      featuredFairsConnection(first: 3, includeBackfill: true) {
        totalCount
        edges {
          node {
            name
          }
        }
      }
    }
  `

  describe("with enough current fairs", () => {
    const fairsLoader = jest.fn(() =>
      Promise.resolve({
        body: range(4).map((i) => mockRunningFair(i)),
        headers: { "x-total-count": "3" },
      })
    )

    it("returns current fairs", async () => {
      const { featuredFairsConnection } = await runQuery(query, { fairsLoader })

      expect(fairsLoader).toHaveBeenCalledTimes(1)

      expect(featuredFairsConnection.totalCount).toBe(30)
      expect(featuredFairsConnection.edges).toMatchInlineSnapshot(`
        [
          {
            "node": {
              "name": "A running fair 0",
            },
          },
          {
            "node": {
              "name": "A running fair 1",
            },
          },
          {
            "node": {
              "name": "A running fair 2",
            },
          },
        ]
      `)
    })
  })

  describe("with not enough current fairs", () => {
    const fairsLoader = jest.fn()

    fairsLoader
      .mockImplementationOnce(() =>
        Promise.resolve({
          body: range(2).map((i) => mockRunningFair(i)),
          headers: { "x-total-count": "2" },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          body: range(2).map((i) => mockPastFair(i)),
          headers: { "x-total-count": "1" },
        })
      )

    describe("with backfill", () => {
      it("returns current and past fairs", async () => {
        const { featuredFairsConnection } = await runQuery(query, {
          fairsLoader,
        })

        expect(fairsLoader).toHaveBeenCalledTimes(2)

        expect(featuredFairsConnection.totalCount).toBe(30)
        expect(featuredFairsConnection.edges).toMatchInlineSnapshot(`
        [
          {
            "node": {
              "name": "A running fair 0",
            },
          },
          {
            "node": {
              "name": "A running fair 1",
            },
          },
          {
            "node": {
              "name": "A past fair 0",
            },
          },
        ]
      `)
      })
    })

    describe("without backfill", () => {
      const fairsLoader = jest.fn(() =>
        Promise.resolve({
          body: range(2).map((i) => mockRunningFair(i)),
          headers: { "x-total-count": "2" },
        })
      )

      it("returns only current fairs", async () => {
        const query = gql`
          {
            featuredFairsConnection(first: 3, includeBackfill: false) {
              totalCount
              edges {
                node {
                  name
                }
              }
            }
          }
        `

        const { featuredFairsConnection } = await runQuery(query, {
          fairsLoader,
        })

        expect(fairsLoader).toHaveBeenCalledTimes(1)

        expect(featuredFairsConnection.totalCount).toBe(2)
        expect(featuredFairsConnection.edges).toMatchInlineSnapshot(`
          [
            {
              "node": {
                "name": "A running fair 0",
              },
            },
            {
              "node": {
                "name": "A running fair 1",
              },
            },
          ]
        `)
      })
    })
  })

  it("filters out future fairs", async () => {
    const fairsLoader = jest.fn(() =>
      Promise.resolve({
        body: range(3)
          .map((i) => mockFutureFair(i))
          .concat(range(3).map((i) => mockRunningFair(i))),
        headers: { "x-total-count": "3" },
      })
    )

    const { featuredFairsConnection } = await runQuery(query, { fairsLoader })

    expect(fairsLoader).toHaveBeenCalledTimes(1)

    expect(featuredFairsConnection.totalCount).toBe(30)
    expect(featuredFairsConnection.edges).toMatchInlineSnapshot(`
        [
          {
            "node": {
              "name": "A running fair 0",
            },
          },
          {
            "node": {
              "name": "A running fair 1",
            },
          },
          {
            "node": {
              "name": "A running fair 2",
            },
          },
        ]
      `)
  })
})

const mockRunningFair = (id) => {
  return {
    id: `running-fair-${id}`,
    default_profile_id: `running-fair-${id}`,
    start_at: moment().subtract(1, "day"),
    end_at: moment().add(1, "day"),
    name: `A running fair ${id}`,
    published: true,
    subtype: null,
    summary: "",
    layout: null,
    display_vip: false,
    has_full_feature: true,
  }
}

const mockPastFair = (id) => {
  return {
    id: `past-fair-${id}`,
    default_profile_id: `past-fair-${id}`,
    start_at: moment().subtract(10, "day"),
    end_at: moment().subtract(1, "day"),
    name: `A past fair ${id}`,
    published: true,
    subtype: null,
    summary: "",
    layout: null,
    display_vip: false,
    has_full_feature: true,
  }
}

const mockFutureFair = (id) => {
  return {
    id: `future-fair-${id}`,
    default_profile_id: `future-fair-${id}`,
    start_at: moment().add(1, "day"),
    end_at: moment().add(10, "day"),
    name: `A future fair ${id}`,
    published: true,
    subtype: null,
    summary: "",
    layout: null,
    display_vip: false,
    has_full_feature: true,
  }
}
