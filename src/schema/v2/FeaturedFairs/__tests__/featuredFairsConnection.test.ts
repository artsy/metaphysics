import gql from "lib/gql"
import { range } from "lodash"
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
    const fairsLoader = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          body: range(4).map((i) => mockRunningFair(i)),
          headers: { "x-total-count": "4" },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          body: range(2).map((i) => mockPastFair(i)),
          headers: { "x-total-count": "100" },
        })
      )

    it("returns current fairs", async () => {
      const { featuredFairsConnection } = await runQuery(query, { fairsLoader })

      expect(fairsLoader).toHaveBeenCalledTimes(2)

      expect(featuredFairsConnection.totalCount).toBe(104)
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
          headers: { "x-total-count": "100" },
        })
      )

    describe("with backfill", () => {
      it("returns current and past fairs", async () => {
        const { featuredFairsConnection } = await runQuery(query, {
          fairsLoader,
        })

        expect(fairsLoader).toHaveBeenCalledTimes(2)

        expect(featuredFairsConnection.totalCount).toBe(102)
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
})

const mockRunningFair = (id) => {
  return {
    id: `running-fair-${id}`,
    default_profile_id: `running-fair-${id}`,
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
    name: `A past fair ${id}`,
    published: true,
    subtype: null,
    summary: "",
    layout: null,
    display_vip: false,
    has_full_feature: true,
  }
}
