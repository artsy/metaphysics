import { GraphQLEnumType } from "graphql"

const EVENT_STATUS_SORTS = {
  CLOSED: { value: "closed", description: "End date is in the past" },
  CURRENT: {
    value: "current",
    description: "Start date or end date is in the future",
  },
  RUNNING: {
    value: "running",
    description: "Start date is in the past and end date is in the future",
  },
  UPCOMING: { value: "upcoming", description: "Start date is in the future" },
  CLOSING_SOON: {
    value: "closing_soon",
    description: "End date is in near future",
  },
  RUNNING_AND_UPCOMING: {
    value: "running_and_upcoming",
    description:
      "Special filtering option which is used to show running and upcoming shows",
  },
  ACTIVE: {
    value: "active",
    description: "Currently active or in-preview shows",
  },
  ALL: {
    value: null,
    description: "Load all shows",
  },
} as const

export const EventStatusEnums = new GraphQLEnumType({
  name: "EventStatus",
  values: EVENT_STATUS_SORTS,
})

export const EventStatus = {
  type: EventStatusEnums,
}

export type EventStatusType = keyof typeof EVENT_STATUS_SORTS

export default EventStatus
