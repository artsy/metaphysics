/**
 * Static fixture data for City Guide itineraries.
 *
 * Gravity's itinerary support is built but not yet deployed, so the
 * `itinerary` root field and its resolvers read from here instead of a
 * loader. This is the ONLY place the fixture data lives — everything else
 * in `schema/v2/itinerary` reads through `fixtureItineraries` /
 * `fixtureItinerary`.
 *
 * When Gravity ships, the swap is:
 *   - delete this file
 *   - replace each `fixtureItinerary(...)` / `fixtureItineraries()` call
 *     site with the matching Gravity loader call (one line each)
 *
 * Keys are snake_case to match the shape Gravity's JSON will return, so
 * that swap doesn't require touching any resolver's field-mapping logic.
 */
import config from "config"

// Gravity has not shipped real staging ids for these yet, so `item_id`
// below is a placeholder BSON-shaped id. `ItineraryStop.item` resolves to
// null until real staging ids are dropped in here — the batched entity
// resolution that turns `item_type` / `item_id` into an actual node is
// part 2's job, and it can only resolve entities that actually exist.
const PLACEHOLDER_ITEM_ID = "000000000000000000000001"
const PLACEHOLDER_ITEM_ID_2 = "000000000000000000000002"

export interface FixtureItineraryStop {
  id: string
  position: number
  title: string | null
  title_override: string | null
  address: string | null
  address_override: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  start_at: string | null
  end_at: string | null
  note: string | null
  category: string | null
  is_free_admission: boolean | null
  item_type: string | null
  item_id: string | null
  event_type: string | null
  event_id: string | null
}

export interface FixtureItinerarySection {
  id: string
  title: string | null
  position: number
  stops_count: number
  stops: FixtureItineraryStop[]
}

export interface FixtureItinerary {
  id: string
  slug: string | null
  name: string
  subtitle: string | null
  description: string | null
  author_name: string | null
  // The owning user's id. Used only for connection-level "is this the
  // caller's own itinerary" filtering — never exposed on `ItineraryType`
  // itself (the association there is `authorName`, still under discussion
  // upstream).
  user_id: string | null
  city_slug: string
  is_curated: boolean
  share_token: string | null
  published_at: string | null
  sections_count: number
  sections: FixtureItinerarySection[]
}

const ITINERARIES: FixtureItinerary[] = [
  {
    id: "3f6e9c2a-1b3d-4e2f-9c3a-1a2b3c4d5e6f",
    slug: "a-day-around-peckham",
    name: "Sample: A day around Peckham",
    subtitle: "Galleries, a fair booth, and a coffee stop",
    description:
      "A curated sample itinerary through south-east London's gallery cluster.",
    author_name: "Artsy Editorial",
    user_id: null,
    city_slug: "london-uk",
    is_curated: true,
    share_token: null,
    published_at: "2026-06-01T09:00:00Z",
    sections_count: 2,
    sections: [
      {
        id: "6f1a2b3c-0001-4a1b-8c2d-1234567890ab",
        title: "Morning",
        position: 0,
        stops_count: 2,
        stops: [
          {
            id: "9a8b7c6d-0001-4a1b-8c2d-abcdef012345",
            position: 0,
            title: "Copeland Gallery",
            title_override: null,
            address: "133 Copeland Road, London SE15 3SN",
            address_override: null,
            image_url: "https://example.com/images/copeland-gallery.jpg",
            latitude: 51.4694,
            longitude: -0.0648,
            start_at: "2026-06-01T10:00:00Z",
            end_at: "2026-06-01T11:00:00Z",
            note: "Open studios on the ground floor.",
            category: "GALLERY",
            is_free_admission: true,
            // See PLACEHOLDER_ITEM_ID comment above: resolves to null until
            // Gravity ships real staging ids.
            item_type: "Partner",
            item_id: PLACEHOLDER_ITEM_ID,
            event_type: null,
            event_id: null,
          },
          {
            id: "9a8b7c6d-0002-4a1b-8c2d-abcdef012345",
            position: 1,
            title: "Rye Wax coffee window",
            title_override: null,
            address: "Rye Lane, London SE15 4ST",
            address_override: null,
            image_url: null,
            latitude: 51.4707,
            longitude: -0.0693,
            start_at: "2026-06-01T11:15:00Z",
            end_at: "2026-06-01T11:45:00Z",
            note: "Just a café — no entity behind this stop.",
            category: null,
            is_free_admission: null,
            item_type: null,
            item_id: null,
            event_type: null,
            event_id: null,
          },
        ],
      },
      {
        id: "6f1a2b3c-0002-4a1b-8c2d-1234567890ab",
        title: "Afternoon",
        position: 1,
        stops_count: 1,
        stops: [
          {
            id: "9a8b7c6d-0003-4a1b-8c2d-abcdef012345",
            position: 0,
            title: "Peckham 76 group show",
            title_override: "Peckham 76: opening weekend",
            address: "76 Peckham Rye, London SE15 4JR",
            address_override: null,
            image_url: "https://example.com/images/peckham-76.jpg",
            latitude: 51.468,
            longitude: -0.0663,
            start_at: "2026-06-01T13:00:00Z",
            end_at: "2026-06-01T15:00:00Z",
            note: null,
            category: "SHOW",
            is_free_admission: true,
            item_type: null,
            item_id: null,
            event_type: "Show",
            event_id: PLACEHOLDER_ITEM_ID,
          },
        ],
      },
    ],
  },
  {
    id: "7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b",
    slug: null,
    name: "Sample: Mira's personal itinerary",
    subtitle: null,
    description: "A private itinerary a collector built for a fair trip.",
    author_name: "Mira Copeland",
    // Matches the default `userID` ("user-42") that
    // `schema/v2/test/utils#runAuthenticatedQuery` stubs, so tests can
    // exercise ownership filtering without extra wiring.
    user_id: "user-42",
    city_slug: "new-york-ny-usa",
    is_curated: false,
    share_token: "sh_9f8e7d6c5b4a3f2e1d0c",
    published_at: null,
    sections_count: 2,
    sections: [
      {
        id: "2b3c4d5e-0001-4a1b-8c2d-fedcba098765",
        title: "Day 1",
        position: 0,
        stops_count: 2,
        stops: [
          {
            id: "1c2d3e4f-0001-4a1b-8c2d-0f1e2d3c4b5a",
            position: 0,
            title: "Sample Fair booth walk",
            title_override: null,
            address: "655 W 34th St, New York, NY 10001",
            address_override: null,
            image_url: null,
            latitude: 40.7566,
            longitude: -74.0021,
            start_at: "2026-05-08T15:00:00Z",
            end_at: "2026-05-08T17:00:00Z",
            note: null,
            category: "FAIR",
            is_free_admission: false,
            item_type: "Fair",
            item_id: PLACEHOLDER_ITEM_ID_2,
            event_type: null,
            event_id: null,
          },
          {
            id: "1c2d3e4f-0002-4a1b-8c2d-0f1e2d3c4b5a",
            position: 1,
            title: "Corner deli break",
            title_override: null,
            address: "10th Ave & W 34th St, New York, NY",
            address_override: null,
            image_url: null,
            latitude: 40.7551,
            longitude: -74.0027,
            start_at: "2026-05-08T17:15:00Z",
            end_at: null,
            note: "Another place-only stop, no item behind it.",
            category: null,
            is_free_admission: null,
            item_type: null,
            item_id: null,
            event_type: null,
            event_id: null,
          },
        ],
      },
      {
        id: "2b3c4d5e-0002-4a1b-8c2d-fedcba098765",
        title: "Day 2",
        position: 1,
        stops_count: 1,
        stops: [
          {
            id: "1c2d3e4f-0003-4a1b-8c2d-0f1e2d3c4b5a",
            position: 0,
            title: "Chelsea gallery crawl",
            title_override: null,
            address: "521 W 26th St, New York, NY 10001",
            address_override: "Enter via the loading dock on 26th",
            image_url: "https://example.com/images/chelsea-crawl.jpg",
            latitude: 40.7503,
            longitude: -74.0034,
            start_at: "2026-05-09T14:00:00Z",
            end_at: "2026-05-09T16:30:00Z",
            note: null,
            category: "GALLERY",
            is_free_admission: true,
            item_type: "Partner",
            item_id: PLACEHOLDER_ITEM_ID,
            event_type: null,
            event_id: null,
          },
        ],
      },
    ],
  },
]

/**
 * Returns all fixture itineraries, or `null` in production. The fixture
 * must never serve real traffic — this is the one place that check lives.
 */
export const fixtureItineraries = (): FixtureItinerary[] | null => {
  if (config.PRODUCTION_ENV) return null

  return ITINERARIES
}

/**
 * Returns a single fixture itinerary by internal id or slug, or `null` in
 * production, or `null` if nothing matches.
 */
export const fixtureItinerary = (idOrSlug: string): FixtureItinerary | null => {
  const itineraries = fixtureItineraries()
  if (!itineraries) return null

  return (
    itineraries.find(
      (itinerary) => itinerary.id === idOrSlug || itinerary.slug === idOrSlug
    ) ?? null
  )
}
