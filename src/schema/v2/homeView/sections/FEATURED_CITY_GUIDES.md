# Featuring a city guide in home view quick links

To promote a curated city guide (e.g. "London City Guide") in the home view
quick links, add an entry to `FEATURED_CITY_GUIDES` in
[`featuredCityGuides.ts`](./featuredCityGuides.ts):

```ts
{
  // A short comment naming the event is helpful for future readers
  citySlug: "london-united-kingdom",
  title: "London City Guide",
  href: "/city-guide?citySlug=london-united-kingdom",
  displayStartAt: "2026-09-22T00:00:00Z",
  displayEndAt: "2026-10-26T00:00:00Z",
}
```

## Fields

- `citySlug` — must be one of the slugs in `CITIES_WITH_GUIDES`
  ([`citiesWithGuides.ts`](./citiesWithGuides.ts)); TypeScript rejects
  anything else at compile time (`CityWithGuideSlug` is derived from that
  list). The pill's coordinates for the proximity check also come from that
  city's entry — there's no separate `coordinates` field here.
- `title` / `href` — what the pill shows and links to while featured.
- `displayStartAt` — ISO 8601 timestamp (UTC) when the pill starts showing as
  featured. Set this to whenever you want the promotion to begin — a week
  before the event, the day of, etc.
- `displayEndAt` — ISO 8601 timestamp (UTC), **exclusive**, when the pill
  stops being featured. Use the _next_ day's midnight to include the full
  last day (e.g. `2026-10-26T00:00:00Z` to include all of October 25th).

## Behavior

- Only one guide is ever expected to be active at a time — if windows
  overlap, the first match in the array wins. There's no tie-break logic.
- Outside a guide's window (or for viewers too far from it), the pill falls
  back to a generic "nearest city guide" link — see
  [`citiesWithGuides.ts`](./citiesWithGuides.ts) for the list of cities that
  fallback can suggest.
- The pill only shows for Eigen `>= 9.19.0` (or non-Eigen clients); see
  `CITY_GUIDE_PILL_MINIMUM_EIGEN_VERSION` in
  [`QuickLinks.ts`](./QuickLinks.ts).
