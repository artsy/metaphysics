import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

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
          startAt
          endAt
        }
      }
    }
  `

  let context: Partial<ResolverContext>

  beforeEach(() => {
    context = {
      showLoader: mockLoader,
      partnerShowLoader: mockLoader,
    }
  })

  it("returns dates with UTC offset", async () => {
    context.userAgent = "some browser"

    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        events: [
          {
            endAt: "2019-03-28T21:00:00+00:00",
            startAt: "2019-03-28T18:00:00+00:00",
          },
        ],
      },
    })
  })
})
