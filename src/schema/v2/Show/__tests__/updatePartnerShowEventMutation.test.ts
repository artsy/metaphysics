import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerShowEventMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerShowEvent(
        input: {
          partnerId: "partner123"
          showId: "show123"
          eventId: "event123"
          eventType: "Closing Reception"
          description: "Join us for the closing reception"
          timeZone: "(GMT-04:00) New York"
        }
      ) {
        showEventOrError {
          __typename
          ... on UpdatePartnerShowEventSuccess {
            showEvent {
              eventType
              description
              startAt
              endAt
              timeZone
              formattedTimeZone
            }
          }
        }
      }
    }
  `

  it("updates a partner show event", async () => {
    const context = {
      updatePartnerShowEventLoader: (_, args) => {
        expect(args.time_zone).toEqual("America/New_York")
        return Promise.resolve({
          _id: "event123",
          event_type: "Closing Reception",
          description: "Join us for the closing reception",
          start_at: "2025-01-01T12:00:00.000Z",
          end_at: "2025-01-01T18:00:00.000Z",
          time_zone: "America/New_York",
        })
      },
    }

    const updatedEvent = await runAuthenticatedQuery(mutation, context)

    expect(updatedEvent).toEqual({
      updatePartnerShowEvent: {
        showEventOrError: {
          __typename: "UpdatePartnerShowEventSuccess",
          showEvent: {
            eventType: "Closing Reception",
            description: "Join us for the closing reception",
            startAt: "2025-01-01T12:00:00.000Z",
            endAt: "2025-01-01T18:00:00.000Z",
            formattedTimeZone: "(GMT-04:00) New York",
            timeZone: "America/New_York",
          },
        },
      },
    })
  })
})
