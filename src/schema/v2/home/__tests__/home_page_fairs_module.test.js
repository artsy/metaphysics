/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("HomePageFairsModule", () => {
  it("works", () => {
    const runningFairs = [
      {
        mobile_image: null,
        id: "artissima-2017",
        default_profile_id: "artissima-2017",
        start_at: "2017-11-03T10:00:00+00:00",
        end_at: "2017-11-05T18:00:00+00:00",
        name: "Artissima 2017",
        published: true,
        subtype: null,
        summary: "",
        layout: null,
        display_vip: false,
        has_full_feature: true,
      },
    ]

    const pastFairs = [
      {
        mobile_image: null,
        id: "zonamaco-foto-and-sal-n-del-anticuario-2017",
        default_profile_id: "zsonamaco-foto-2017",
        start_at: "2017-09-20T13:45:00+00:00",
        end_at: "2017-09-24T13:45:00+00:00",
        name: "Zâ“ˆONAMACO FOTO & SALÃ“N DEL ANTICUARIO 2017",
        published: true,
        subtype: null,
        summary: "",
        layout: null,
        display_vip: false,
        has_full_feature: true,
      },
    ]

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

    return runQuery(query, {
      fairsLoader: (options) =>
        Promise.resolve({ body: options.active ? runningFairs : pastFairs }),
    }).then((fairsModule) => {
      expect(fairsModule).toMatchSnapshot()
    })
  })

  it("puts fairs that haven't started yet at the end of the results", async () => {
    const fairs = [
      {
        mobile_image: {},
        id: "future-fair",
        start_at: "2027-11-03T10:00:00+00:00",
        name: "Future Fair",
      },
      {
        mobile_image: {},
        id: "current-fair",
        start_at: "2017-11-03T10:00:00+00:00",
        name: "Current Fair",
      },
    ]

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

    const fairModule = await runQuery(query, {
      fairsLoader: (options) => Promise.resolve({ body: fairs }),
    })
    const results = fairModule.homePage.fairsModule.results
    expect(results[0].slug).toEqual("current-fair")
    expect(results[1].slug).toEqual("future-fair")
  })

  it("does not request past fairs if it has 8 running ones", () => {
    const aFair = {
      id: "artissima-2017",
      name: "Artissima 2017",
    }

    const runningFairs = []
    for (let index = 0; index < 8; index++) {
      runningFairs[index] = aFair
    }

    const pastFairs = [
      {
        id: "zonamaco-foto-and-sal-n-del-anticuario-2017",
        name: "Zâ“ˆONAMACO FOTO & SALÃ“N DEL ANTICUARIO 2017",
      },
      {
        id: "past-fair-2017",
        name: "I Should Not Show Up in the Snapshot",
      },
    ]

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

    return runQuery(query, {
      fairsLoader: (options) =>
        Promise.resolve({ body: options.active ? runningFairs : pastFairs }),
    }).then((fairsModule) => {
      expect(fairsModule).toMatchSnapshot()
    })
  })

  // FIXME: Snapshot seems to change
  it.skip("does not return fairs that do not have mobile images", () => {
    const aFair = [
      {
        id: "artissima-2017",
        name: "Artissima 2017",
        mobile_image: "circle-image.jpg",
      },
    ]

    const pastFairs = [
      {
        id: "zonamaco-foto-and-sal-n-del-anticuario-2017",
        name: "Zâ“ˆONAMACO FOTO & SALÃ“N DEL ANTICUARIO 2017",
        mobile_image: {
          image_url: "circle-image.jpg",
        },
      },
      {
        id: "past-fair-2017",
        name: "I Should Not Show Up in the Snapshot",
        mobile_image: null,
      },
    ]

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

    return runQuery(query, {
      fairsLoader: (options) =>
        Promise.resolve({ body: options.active ? aFair : pastFairs }),
    }).then((fairsModule) => {
      // FIXME: isActive flipped from true to false here and I'm not sure why
      expect(fairsModule).toMatchSnapshot()
    })
  })
})
