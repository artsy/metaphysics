import {
  FormattedDaySchedules,
  DaySchedule,
} from "../types/formattedDaySchedules"

const formatDaySchedules = FormattedDaySchedules.resolve

describe("FormattedDaySchedules.resolve", () => {
  it("collapses times duplicated across days", () => {
    const daySchedules = [
      {
        day_of_week: "Monday",
        start_time: 37800,
        end_time: 68400,
      },
      {
        day_of_week: "Tuesday",
        start_time: 37800,
        end_time: 68400,
      },
      {
        day_of_week: "Wednesday",
        start_time: 37800,
        end_time: 68400,
      },
      {
        day_of_week: "Thursday",
        start_time: 37800,
        end_time: 68400,
      },
      {
        day_of_week: "Friday",
        start_time: 37800,
        end_time: 68400,
      },
      {
        day_of_week: "Saturday",
        start_time: 37800,
        end_time: 68400,
      },
    ]
    expect(formatDaySchedules(daySchedules as Array<DaySchedule>)).toEqual([
      {
        days: "Monday–Saturday",
        hours: "10:30am–7pm",
      },
      {
        days: "Sunday",
        hours: "Closed",
      },
    ])
  })

  it("handles multiple time segments in a single day", () => {
    const daySchedules = [
      {
        start_time: 39600,
        end_time: 50400,
        day_of_week: "Sunday",
      },
      {
        start_time: 61200,
        end_time: 72000,
        day_of_week: "Sunday",
      },
      {
        start_time: 39600,
        end_time: 50400,
        day_of_week: "Monday",
      },
      {
        start_time: 64800,
        end_time: 72000,
        day_of_week: "Monday",
      },
      {
        start_time: 39600,
        end_time: 50400,
        day_of_week: "Wednesday",
      },
      {
        start_time: 64800,
        end_time: 72000,
        day_of_week: "Wednesday",
      },
      {
        start_time: 39600,
        end_time: 50400,
        day_of_week: "Thursday",
      },
      {
        start_time: 64800,
        end_time: 72000,
        day_of_week: "Thursday",
      },
      {
        start_time: 39600,
        end_time: 50400,
        day_of_week: "Friday",
      },
      {
        start_time: 64800,
        end_time: 72000,
        day_of_week: "Friday",
      },
      {
        start_time: 39600,
        end_time: 50400,
        day_of_week: "Saturday",
      },
      {
        start_time: 64800,
        end_time: 72000,
        day_of_week: "Saturday",
      },
    ]
    expect(formatDaySchedules(daySchedules as Array<DaySchedule>)).toEqual([
      {
        days: "Monday, Wednesday–Saturday",
        hours: "11am–2pm, 6pm–8pm",
      },
      {
        days: "Tuesday",
        hours: "Closed",
      },
      {
        days: "Sunday",
        hours: "11am–2pm, 5pm–8pm",
      },
    ])
  })

  it("handles empty schedules", () => {
    expect(formatDaySchedules([])).toEqual([])
  })
})
