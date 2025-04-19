import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createPartnerLocationDaySchedules(
      input: {
        partnerId: "5f80bfefe8d808000ea212c1"
        locationId: "64fa15a89846f3000aef6c84"
        daySchedules: [
          { day: 1, startTime: 1000, endTime: 2000 }
          { day: 2, startTime: 1000, endTime: 2000 }
        ]
      }
    ) {
      daySchedulesOrError {
        __typename
        ... on CreatePartnerLocationDaySchedulesSuccess {
          daySchedules {
            dayOfWeek
            startTime
            endTime
          }
        }
        ... on CreatePartnerLocationDaySchedulesFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("createPartnerLocationDaySchedules", () => {
  describe("when successful", () => {
    const weeklySchedule = [
      {
        id: "day-1",
        _id: "day-1",
        day: 1,
        day_of_week: "Monday",
        start_time: 1000,
        end_time: 2000,
      },
      {
        id: "day-2",
        _id: "day-2",
        day: 2,
        day_of_week: "Tuesday",
        start_time: 1000,
        end_time: 2000,
      },
    ]

    const context = {
      createPartnerLocationDaySchedulesLoader: () =>
        Promise.resolve(weeklySchedule),
    }

    it("creates a new weekly schedule for the given location", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createPartnerLocationDaySchedules: {
          daySchedulesOrError: {
            __typename: "CreatePartnerLocationDaySchedulesSuccess",
            daySchedules: [
              {
                dayOfWeek: "Monday",
                startTime: 1000,
                endTime: 2000,
              },
              {
                dayOfWeek: "Tuesday",
                startTime: 1000,
                endTime: 2000,
              },
            ],
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        createPartnerLocationDaySchedulesLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partner/:id/location - {"type":"error","message":"Location not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createPartnerLocationDaySchedules: {
          daySchedulesOrError: {
            __typename: "CreatePartnerLocationDaySchedulesFailure",
            mutationError: {
              message: "Location not found",
            },
          },
        },
      })
    })
  })
})
