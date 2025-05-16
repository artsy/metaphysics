import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const ViewingRooms: HomeViewSection = {
  id: "home-view-section-viewing-rooms",
  type: HomeViewSectionTypeNames.HomeViewSectionViewingRooms,
  contextModule: ContextModule.featuredViewingRoomsRail,
  component: {
    title: "Viewing Rooms",
    description: "Immersive online exhibition spaces by top galleries",
    behaviors: {
      viewAll: {
        href: "/viewing-rooms",
        ownerType: OwnerType.viewingRooms,
      },
    },
  },
  requiresAuthentication: false,
}
