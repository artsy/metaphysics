# Featuring a city guide in home view quick links

To promote a curated city guide (e.g. "London City Guide") in the home view
quick links, edit `FEATURED_CITY_GUIDE` in
[`featuredCityGuides.ts`](./featuredCityGuides.ts):

```ts
export const FEATURED_CITY_GUIDE: FeaturedCityGuide = {
  // A short comment naming the event is helpful for future readers
  citySlug: "london-united-kingdom",
  title: "London City Guide",
  displayStartAt: "2026-10-05T00:00:00Z",
  displayEndAt: "2026-10-25T00:00:00Z",
}
```

## Fields

- `citySlug` — must be one of the slugs in `CITIES_WITH_GUIDES`
  ([`citiesWithGuides.ts`](./citiesWithGuides.ts)); TypeScript rejects
  anything else at compile time (`CityWithGuideSlug` is derived from that
  list). The pill links to `/city-guide?citySlug=<citySlug>`.
- `title` — what the pill shows while featured.
- `displayStartAt` — ISO 8601 timestamp (UTC) when the pill starts showing as
  featured. Set this to whenever you want the promotion to begin — a week
  before the event, the day of, etc.
- `displayEndAt` — ISO 8601 timestamp (UTC), **exclusive**, when the pill
  stops being featured. Use the _next_ day's midnight to include the full
  last day (e.g. `2026-10-26T00:00:00Z` to include all of October 25th).

## Behavior

- Only one guide can be featured at a time. To promote another city, replace
  the entry.
- Inside the window, every viewer sees the featured pill, wherever they are.
  The viewer's IP location is not looked up.
- Outside the window, the pill falls back to a generic "City Guide" link that
  suggests the city nearest to the viewer's IP location — see
  [`citiesWithGuides.ts`](./citiesWithGuides.ts) for the list of cities that
  fallback can suggest.
- The same window controls a hero unit in the home view's hero units section.
  While the guide is active, the unit is added as the first item of the first
  page. Its copy and image live in
  [`withFeaturedCityGuideHeroUnit.ts`](../helpers/withFeaturedCityGuideHeroUnit.ts).
  Update them when you replace the guide.
- The pill only shows for Eigen `>= 9.19.0` (or non-Eigen clients); see
  `CITY_GUIDE_PILL_MINIMUM_EIGEN_VERSION` in
  [`QuickLinks.ts`](./QuickLinks.ts).
