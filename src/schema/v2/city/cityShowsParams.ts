import { LOCAL_DISCOVERY_RADIUS_KM } from "./constants"
import type { TCity } from "./index"

export interface CityShowsFilters {
  partnerType?: string[] | null
  dayThreshold?: number | null
  status?: string | null
  includeStubShows?: boolean | null
  maxPerPartner?: number | null
}

// The Gravity params for a city's shows, shared by /shows, me/city_shows and me/city_artists.
export const cityShowsParams = (
  city: TCity,
  filters: CityShowsFilters,
  sort?: string | null
) => ({
  ...(city.slug === "online"
    ? { has_location: false }
    : {
        near: city.coords.join(","),
        max_distance: LOCAL_DISCOVERY_RADIUS_KM,
        has_location: true,
      }),
  at_a_fair: false,
  ...(filters.partnerType && { partner_types: filters.partnerType }),
  ...(filters.dayThreshold && { day_threshold: filters.dayThreshold }),
  ...(sort !== undefined && { sort }),
  // default Enum value for status is not properly resolved
  // so we have to manually resolve it by lowercasing the value
  // https://github.com/apollographql/graphql-tools/issues/715
  ...(filters.status && { status: filters.status.toLowerCase() }),
  displayable: true,
  include_local_discovery: filters.includeStubShows || false,
  include_discovery_blocked: false,
  max_per_partner: filters.maxPerPartner,
})
