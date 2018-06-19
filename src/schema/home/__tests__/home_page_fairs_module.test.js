/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

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
        home_page {
          fairs_module {
            results {
              id
              name
              is_active
            }
          }
        }
      }
    `

    return runQuery(query, {
      fairsLoader: options =>
        Promise.resolve(options.active ? runningFairs : pastFairs),
    }).then(fairsModule => {
      expect(fairsModule).toMatchSnapshot()
    })
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
        home_page {
          fairs_module {
            results {
              id
              name
              is_active
            }
          }
        }
      }
    `

    return runQuery(query, {
      fairsLoader: options =>
        Promise.resolve(options.active ? runningFairs : pastFairs),
    }).then(fairsModule => {
      expect(fairsModule).toMatchSnapshot()
    })
  })

  it("does not return fairs that do not have mobile images", () => {
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
        home_page {
          fairs_module {
            results {
              id
              name
              is_active
            }
          }
        }
      }
    `

    return runQuery(query, {
      fairsLoader: options =>
        Promise.resolve(options.active ? aFair : pastFairs),
    }).then(fairsModule => {
      expect(fairsModule).toMatchSnapshot()
    })
  })
})
