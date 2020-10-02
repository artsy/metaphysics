import { runQuery } from "schema/v1/test/utils"
import gql from "lib/gql"

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
