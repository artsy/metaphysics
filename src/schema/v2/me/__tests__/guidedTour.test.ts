/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const snapshot = {
  context: "catalog_os",
  active_tour: {
    key: "welcome",
    state: "in_progress",
    steps: [
      {
        key: "welcome.0",
        anchor_key: "add-artwork-button",
        placement: "bottom-end",
        title: "Add your first artwork",
        body: "Start here.",
        cta_label: "Next",
        completes_item_key: "add-first-artwork",
        index: 0,
        total: 2,
      },
    ],
  },
  active_step: {
    key: "welcome.0",
    anchor_key: "add-artwork-button",
    placement: "bottom-end",
    title: "Add your first artwork",
    body: "Start here.",
    cta_label: "Next",
    completes_item_key: "add-first-artwork",
    index: 0,
    total: 2,
  },
  checklist: {
    completed_count: 1,
    total_count: 2,
    items: [
      { key: "check-out-space", title: "Check out", state: "complete" },
      {
        key: "add-to-artsy-draft",
        title: "Add to Artsy",
        state: "incomplete",
        show_me_how_tour: {
          key: "add-to-artsy-draft",
          state: "not_started",
          steps: [
            {
              key: "add-to-artsy-draft.0",
              anchor_key: "inventory-row-actions",
              placement: "left-start",
              title: "Open the menu",
              body: "Click the ellipsis.",
              cta_label: "Got it",
              index: 0,
              total: 1,
            },
          ],
        },
      },
    ],
  },
}

describe("Me guided tour", () => {
  describe("me.guidedTour", () => {
    it("returns the server-driven state mapped to the schema", async () => {
      const query = gql`
        {
          me {
            guidedTour(context: CATALOG_OS) {
              context
              activeTour {
                key
                state
                steps {
                  anchorKey
                  completesItemKey
                  index
                  total
                }
              }
              activeStep {
                anchorKey
              }
              checklist {
                completedCount
                totalCount
                items {
                  key
                  state
                  showMeHowTour {
                    key
                  }
                }
              }
            }
          }
        }
      `

      const meGuidedTourLoader = jest.fn().mockResolvedValue(snapshot)
      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        meGuidedTourLoader,
      }

      const { me } = await runAuthenticatedQuery(query, context)

      expect(meGuidedTourLoader).toHaveBeenCalledWith({ context: "catalog_os" })
      expect(me.guidedTour).toEqual({
        context: "CATALOG_OS",
        activeTour: {
          key: "welcome",
          state: "IN_PROGRESS",
          steps: [
            {
              anchorKey: "add-artwork-button",
              completesItemKey: "add-first-artwork",
              index: 0,
              total: 2,
            },
          ],
        },
        activeStep: { anchorKey: "add-artwork-button" },
        checklist: {
          completedCount: 1,
          totalCount: 2,
          items: [
            { key: "check-out-space", state: "COMPLETE", showMeHowTour: null },
            {
              key: "add-to-artsy-draft",
              state: "INCOMPLETE",
              showMeHowTour: { key: "add-to-artsy-draft" },
            },
          ],
        },
      })
    })
  })

  describe("recordGuidedTourEvent", () => {
    const mutation = gql`
      mutation {
        recordGuidedTourEvent(
          input: { context: CATALOG_OS, type: TOUR_STARTED, tourKey: "welcome" }
        ) {
          recordGuidedTourEventOrError {
            ... on RecordGuidedTourEventSuccess {
              guidedTour {
                activeTour {
                  state
                }
              }
            }
            ... on RecordGuidedTourEventFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("records the event and returns the refreshed state", async () => {
      const recordGuidedTourEventLoader = jest.fn().mockResolvedValue(snapshot)

      const data = await runAuthenticatedQuery(mutation, {
        recordGuidedTourEventLoader,
      })

      expect(recordGuidedTourEventLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          context: "catalog_os",
          type: "tour_started",
          tour_key: "welcome",
        })
      )
      expect(data).toEqual({
        recordGuidedTourEvent: {
          recordGuidedTourEventOrError: {
            guidedTour: { activeTour: { state: "IN_PROGRESS" } },
          },
        },
      })
    })

    it("returns a mutation error when recording fails", async () => {
      const recordGuidedTourEventLoader = jest
        .fn()
        .mockRejectedValue(new Error("Context Not Found"))

      const data = await runAuthenticatedQuery(mutation, {
        recordGuidedTourEventLoader,
      })

      expect(data).toEqual({
        recordGuidedTourEvent: {
          recordGuidedTourEventOrError: {
            mutationError: { message: "Context Not Found" },
          },
        },
      })
    })
  })
})
