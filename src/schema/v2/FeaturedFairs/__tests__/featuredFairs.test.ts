import gql from "lib/gql"
import { range } from "lodash"
import { runQuery } from "schema/v2/test/utils"

describe("featuredFairs", () => {
  const requestedSize = 3
  const query = gql`
    {
      featuredFairs(size: ${requestedSize}, includeBackfill: true) {
        name
      }
    }
  `

  describe("with enough current fairs", () => {
    const fairsLoader = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        body: range(requestedSize).map((i) => mockRunningFair(i)),
        headers: {},
      })
    )

    it("returns current fairs", async () => {
      const { featuredFairs } = await runQuery(query, { fairsLoader })

      expect(fairsLoader).toHaveBeenCalledTimes(1)

      expect(featuredFairs).toMatchInlineSnapshot(`
        [
          {
            "name": "A running fair 0",
          },
          {
            "name": "A running fair 1",
          },
          {
            "name": "A running fair 2",
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
          body: range(requestedSize - 1).map((i) => mockRunningFair(i)),
          headers: {},
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          body: range(1).map((i) => mockPastFair(i)),
          headers: {},
        })
      )

    describe("with backfill", () => {
      it("returns current and past fairs", async () => {
        const { featuredFairs } = await runQuery(query, {
          fairsLoader,
        })

        expect(fairsLoader).toHaveBeenCalledTimes(2)

        expect(featuredFairs).toMatchInlineSnapshot(`
          [
            {
              "name": "A running fair 0",
            },
            {
              "name": "A running fair 1",
            },
            {
              "name": "A past fair 0",
            },
          ]
        `)
      })
    })

    describe("without backfill", () => {
      const fairsLoader = jest.fn(() =>
        Promise.resolve({
          body: range(requestedSize - 1).map((i) => mockRunningFair(i)),
          headers: {},
        })
      )

      it("returns only current fairs", async () => {
        const query = gql`
          {
            featuredFairs(size: ${requestedSize}, includeBackfill: false) {
              name
            }
          }
        `

        const { featuredFairs } = await runQuery(query, {
          fairsLoader,
        })

        expect(fairsLoader).toHaveBeenCalledTimes(1)

        expect(featuredFairs).toMatchInlineSnapshot(`
          [
            {
              "name": "A running fair 0",
            },
            {
              "name": "A running fair 1",
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
