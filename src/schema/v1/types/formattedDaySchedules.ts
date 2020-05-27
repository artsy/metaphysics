import { GraphQLString, GraphQLObjectType } from "graphql"
import moment from "moment"
import _ from "lodash"
import { ResolverContext } from "types/graphql"

enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export interface DaySchedule {
  day_of_week: DayOfWeek
  start_time: number
  end_time: number
}

// Takes a day of the week as a string and returns a formatted schedule for a day of the week or closed:
// { start: 'Monday', hours: '10:30am–7pm' } or { start: 'Tuesday', hours: 'Closed'}
function formatDaySchedule(day: DayOfWeek, daySchedules: Array<DaySchedule>) {
  const filteredDaySchedules = _.filter(daySchedules, { day_of_week: day })
  if (filteredDaySchedules.length) {
    const hours: Array<string> = []
    filteredDaySchedules.forEach((daySchedule) => {
      const startHour = moment().hour(daySchedule["start_time"] / 60 / 60)
      const startMinute = moment().minutes(daySchedule["start_time"] / 60)
      const endHour = moment().hour(daySchedule["end_time"] / 60 / 60)
      const endMinute = moment().minutes(daySchedule["end_time"] / 60)
      hours.push(
        startHour.format("h") +
          (startMinute.format("mm") === "00" ? "" : startMinute.format(":mm")) +
          startHour.format("a") +
          "–" +
          endHour.format("h") +
          (endMinute.format("mm") === "00" ? "" : endMinute.format(":mm")) +
          endHour.format("a")
      )
    })
    return {
      start: day,
      hours: _.uniq(hours).join(", "),
    }
  } else {
    return {
      start: day,
      hours: "Closed",
    }
  }
}

// Returns an array of formatted 'day schedule' objects for a 7 day week:
// [{ start: 'Monday', hours: '10am – 7pm'}, {start: 'Tuesday, hours: 'Closed'}, ... ]
export function formatDaySchedules(daySchedules: Array<DaySchedule>) {
  if (_.isEmpty(daySchedules)) {
    return []
  }
  const formattedDaySchedules = () =>
    _.map(Object.values(DayOfWeek), (day) => {
      return formatDaySchedule(day, daySchedules)
    })

  const daysOpen = [formattedDaySchedules()[0]]
  _.each(formattedDaySchedules().slice(1), function (daySchedule) {
    if (
      daySchedule &&
      daySchedule["hours"] ===
        (_.last(daysOpen) as Record<string, any>)["hours"]
    ) {
      return _.extend(_.last(daysOpen), { end: daySchedule["start"] })
    } else {
      return daysOpen.push({
        start: daySchedule["start"],
        hours: daySchedule["hours"],
      })
    }
  })

  return _.chain(daysOpen)
    .groupBy("hours")
    .map((schedule) =>
      _.chain(schedule)
        .map((day) => ({
          days: day["end"] ? day["start"] + "–" + day["end"] : day["start"],
          hours: schedule[0]["hours"],
        }))
        .reduce(function (memo: { days: string; hours: string }, iteratee) {
          memo["days"] = memo["days"] + ", " + iteratee["days"]
          return memo
        })
        .value()
    )
    .value()
}

const FormattedDaySchedulesType = new GraphQLObjectType<any, ResolverContext>({
  name: "FormattedDaySchedules",
  fields: () => ({
    days: {
      type: GraphQLString,
    },
    hours: {
      type: GraphQLString,
    },
  }),
})

// TODO: This isn't being used as a GraphQLFieldConfig, it seems.
export const FormattedDaySchedules = {
  type: FormattedDaySchedulesType,
  resolve: formatDaySchedules,
}
