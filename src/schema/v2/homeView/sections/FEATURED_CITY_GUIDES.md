# Featuring a city guide in home view quick links

To promote a curated city guide (e.g. "London City Guide") in the home view,
edit `FEATURED_CITY_GUIDE` in [`featuredCityGuides.ts`](./featuredCityGuides.ts).
It holds everything the quick-links pill and the hero unit need:

```ts
export const FEATURED_CITY_GUIDE: FeaturedCityGuide = {
  // A short comment naming the event is helpful for future readers
  citySlug: "london-united-kingdom",
  displayStartAt: "2026-10-05T00:00:00Z",
  displayEndAt: "2026-10-25T00:00:00Z",
  pill: { title: "London City Guide" },
  heroUnit: {
    id: "london-art-week-2026",
    title: "Your Guide to London Art Week",
    body: "All the art highlights between Oct. 14–19.",
    ctaText: "Explore Now",
    image: {
      url: "https://files.artsy.net/images/...png",
      width: 2880,
      height: 1200,
    },
  },
}
```

## Fields

- `citySlug` — must be one of the slugs in `CITIES_WITH_GUIDES`
  ([`citiesWithGuides.ts`](./citiesWithGuides.ts)); TypeScript rejects
  anything else at compile time (`CityWithGuideSlug` is derived from that
  list). The pill and the hero unit both link to
  `/city-guide?citySlug=<citySlug>`.
- `displayStartAt` — ISO 8601 timestamp (UTC) when the promotion starts. Set
  this to whenever you want it to begin — a week before the event, the day
  of, etc.
- `displayEndAt` — ISO 8601 timestamp (UTC), **exclusive**, when the promotion
  stops. Use the _next_ day's midnight to include the full last day (e.g.
  `2026-10-26T00:00:00Z` to include all of October 25th).
- `pill.title` — what the quick-links pill shows.
- `heroUnit` — the hero unit's id, title, body, button text and image (with
  its pixel size).

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
  page (`first` set, no `after`, `before` or `last`). That page has one more
  edge than `first` so the cursors stay in step with Gravity's pages. The unit
  is built in
  [`withFeaturedCityGuideHeroUnit.ts`](../helpers/withFeaturedCityGuideHeroUnit.ts).
- The pill only shows for Eigen `>= 9.19.0` (or non-Eigen clients); see
  `CITY_GUIDE_PILL_MINIMUM_EIGEN_VERSION` in
  [`QuickLinks.ts`](./QuickLinks.ts).
