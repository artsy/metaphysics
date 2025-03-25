import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerShowEventMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerShowEvent(
        input: {
          partnerId: "partner123"
          showId: "show123"
          eventId: "event123"
        }
      ) {
        showEventOrError {
          __typename
          ... on DeletePartnerShowEventSuccess {
            showEvent {
              eventType
              description
            }
          }
        }
      }
    }
  `

  it("deletes a partner show event", async () => {
    const context = {
      deletePartnerShowEventLoader: () =>
        Promise.resolve({
          _id: "event123",
          event_type: "Opening Reception",
          description: "Join us for the opening reception",
        }),
    }

    const deletedEvent = await runAuthenticatedQuery(mutation, context)

    expect(deletedEvent).toEqual({
      deletePartnerShowEvent: {
        showEventOrError: {
          __typename: "DeletePartnerShowEventSuccess",
          showEvent: {
            eventType: "Opening Reception",
            description: "Join us for the opening reception",
          },
        },
      },
    })
  })
})
