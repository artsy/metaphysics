import { runQuery } from "schema/v1/test/utils"
import gql from "lib/gql"
import moment from "moment"

// This time-bomb spec will fail starting at some defined point in the future,
// indicating that we should consider reverting this behavior of sending
// different raw date representations to different versions of Eigen
// (in the hope that usage of older versions has dropped below some minimum threshold).

xit("is not yet time to rethink this UA-sniffing behavior for resolving dates", () => {
  const today = moment()
  const deadline = moment("2020-10-01") // about 18 months after adding this behavior

  let itIsTimeToRethinkThis = today.isAfter(deadline)

  expect(itIsTimeToRethinkThis).toBe(false)
})

// In the meantime, here is the custom date resolving behavior

describe("date resolving", () => {
  const showData = {
    id: "helwaser-gallery-anton-ginzburg-views",
    displayable: true,
    partner: {
      id: "helwaser-gallery",
    },
    events: [
      {
        event_type: "Opening Reception",
        start_at: "2019-03-28T18:00:00+00:00",
        end_at: "2019-03-28T21:00:00+00:00",
      },
    ],
  }

  const mockLoader = jest.fn(() => Promise.resolve(showData))

  const query = gql`
    {
      show(id: "helwaser-gallery-anton-ginzburg-views") {
        events {
          start_at
          end_at
        }
      }
    }
  `

  let context: any

  beforeEach(() => {
    context = {
      showLoader: mockLoader,
      partnerShowLoader: mockLoader,
      unauthenticatedLoaders: {
        showLoader: mockLoader,
      },
      authenticatedLoaders: {
        showLoader: mockLoader,
      },
    }
  })

  describe("default behavior", () => {
    it("returns dates with UTC offset", async () => {
      context.userAgent = "some browser"

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          events: [
            {
              end_at: "2019-03-28T21:00:00+00:00",
              start_at: "2019-03-28T18:00:00+00:00",
            },
          ],
        },
      })
    })
  })

  describe("with Eigen 4.4.x", () => {
    it("truncates the UTC offset", async () => {
      context.userAgent =
        "iPhone9,1 Mozilla/5.0 Artsy-Mobile/4.4.1 Eigen/2019.03.15.11/4.4.1 (iPhone; iOS 12.1.4; Scale/2.00) AppleWebKit/601.1.46 (KHTML, like Gecko)"

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          events: [
            {
              end_at: "2019-03-28T21:00:00",
              start_at: "2019-03-28T18:00:00",
            },
          ],
        },
      })
    })
  })

  describe("with Eigen 5.0.0", () => {
    it("truncates the UTC offset", async () => {
      context.userAgent =
        "iPhone11,6 Mozilla/5.0 Artsy-Mobile/5.0.0 Eigen/2019.03.20.14/5.0.0 (iPhone; iOS 12.1.4; Scale/3.00) AppleWebKit/601.1.46 (KHTML, like Gecko)"

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          events: [
            {
              end_at: "2019-03-28T21:00:00",
              start_at: "2019-03-28T18:00:00",
            },
          ],
        },
      })
    })
  })

  describe("with Eigen 5.0.1", () => {
    it("truncates the UTC offset", async () => {
      context.userAgent =
        "x86_64 Mozilla/5.0 Artsy-Mobile/5.0.1 Eigen/2019.02.28.17/5.0.1 (iPhone; iOS 12.2; Scale/2.00) AppleWebKit/60 1.1.46 (KHTML, like Gecko)"

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          events: [
            {
              end_at: "2019-03-28T21:00:00",
              start_at: "2019-03-28T18:00:00",
            },
          ],
        },
      })
    })
  })

  describe("When an Eigen user agent is returned as part of an array", () => {
    it("truncates the UTC offset", async () => {
      context.userAgent = [
        "x86_64 Mozilla/5.0 Artsy-Mobile/5.0.1 Eigen/2019.02.28.17/5.0.1 (iPhone; iOS 12.2; Scale/2.00) AppleWebKit/60 1.1.46 (KHTML, like Gecko)",
      ]

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          events: [
            {
              end_at: "2019-03-28T21:00:00",
              start_at: "2019-03-28T18:00:00",
            },
          ],
        },
      })
    })
  })
})
