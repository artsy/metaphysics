import { runQuery } from "schema/v2/test/utils"
import moment from "moment"
import { range } from "lodash"

// adding this dep explicitly so the tests run when we change the main file
;() => {
  require("../home_page_fairs_module")
}

let _counter = 0
const uniqid = () => _counter++

const mockRunningFair = () => {
  const id = uniqid()
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

const mockFutureFair = () => {
  const id = uniqid()
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

const mockPastFair = () => {
  const id = uniqid()
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

const isRunningFair = (fair) => fair.name.startsWith("A running fair")
const isNotFutureFair = (fair) => !fair.name.startsWith("A future fair")

const runFairsQuery = async (query, config) =>
  runQuery(query, {
    fairsLoader: (options) => Promise.resolve(config(options)),
  })

describe("HomePageFairsModule", () => {
  it("shows the correct number of fairs", async () => {
    const runningFairs = [mockRunningFair()]

    const pastFairs = [mockPastFair()]

    const query = `
      {
        homePage {
          fairsModule {
            results {
              slug
              name
              isActive
            }
          }
        }
      }
    `

    const fairsModule = await runFairsQuery(query, (options) => ({
      body: options.active ? runningFairs : pastFairs,
    }))
    const results = fairsModule.homePage.fairsModule.results
    expect(results).toHaveLength(2)
  })

  it("does not request past fairs if it has 8 running ones", async () => {
    const runningFairs = range(8).map(() => mockRunningFair())

    const pastFairs = [mockPastFair()]

    const query = `
      {
        homePage {
          fairsModule {
            results {
              slug
              name
              isActive
            }
          }
        }
      }
    `

    const fairsModule = await runFairsQuery(query, (options) => ({
      body: options.active ? runningFairs : pastFairs,
    }))
    const results = fairsModule.homePage.fairsModule.results
    expect(results).toHaveLength(8)
    expect(results).not.toIncludeAnyMembers(pastFairs)
    expect(results).toSatisfyAll(isRunningFair)
  })

  it("doesn't return fairs that haven't opened yet", async () => {
    const query = `
      {
        homePage {
          fairsModule {
            results {
              name
            }
          }
        }
      }
	`

    const fairs = [mockRunningFair(), mockFutureFair()]

    const fairsModule = await runFairsQuery(query, () => ({ body: fairs }))
    const results = fairsModule.homePage.fairsModule.results
    expect(results).toHaveLength(1)
    expect(results).toSatisfyAll(isNotFutureFair)
  })
})
