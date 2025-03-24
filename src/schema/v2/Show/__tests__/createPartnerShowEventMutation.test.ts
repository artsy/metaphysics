import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerShowEventMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerShowEvent(
        input: {
          partnerId: "partner123"
          showId: "show123"
          startAt: "2025-01-01T12:00:00+00:00"
          endAt: "2025-01-01T18:00:00+00:00"
          eventType: "Opening Reception"
          description: "Join us for the opening reception"
        }
      ) {
        showEventOrError {
          __typename
          ... on CreatePartnerShowEventSuccess {
            showEvent {
              eventType
              description
              startAt
              endAt
            }
          }
        }
      }
    }
  `

  it("creates a partner show event", async () => {
    const context = {
      createPartnerShowEventLoader: () =>
        Promise.resolve({
          _id: "event123",
          event_type: "Opening Reception",
          description: "Join us for the opening reception",
          start_at: "2025-01-01T12:00:00.000Z",
          end_at: "2025-01-01T18:00:00.000Z",
        }),
    }

    const createdEvent = await runAuthenticatedQuery(mutation, context)

    expect(createdEvent).toEqual({
      createPartnerShowEvent: {
        showEventOrError: {
          __typename: "CreatePartnerShowEventSuccess",
          showEvent: {
            eventType: "Opening Reception",
            description: "Join us for the opening reception",
            startAt: "2025-01-01T12:00:00.000Z",
            endAt: "2025-01-01T18:00:00.000Z",
          },
        },
      },
    })
  })
})
