---
name: feature-city-guide
description: Feature (promote) a city guide in the home view quick links for a date window, or replace the currently featured one. Asks for the city (from CITIES_WITH_GUIDES), the display start and the display end. Use for requests like “feature the London guide” or “change the featured city guide”.
---

# Feature a city guide

Read [src/schema/v2/homeView/sections/FEATURED_CITY_GUIDES.md](../../../src/schema/v2/homeView/sections/FEATURED_CITY_GUIDES.md) first. It is the source of truth for the fields, the exclusive end date, valid slugs and the pill’s behavior. This skill doesn’t repeat it. It adds only the checks that go wrong in these PRs.

If the code and that doc disagree (a renamed constant, a different minimum Eigen version), follow the code and fix the doc in the same PR.

## 1. Ask for the inputs

Get these three answers from the developer before editing. Ask in one message for whatever the request didn’t already state, and don’t guess:

1. **City.** Read the slugs and names from `CITIES_WITH_GUIDES` in `citiesWithGuides.ts` and offer them as the choices. Map the answer to its slug. If the city isn’t in that list, stop and say so: adding a city guide is a separate change, and TypeScript rejects slugs that aren’t in the list.
2. **Display start:** the first day the pill shows as featured.
3. **Display end:** the last day the pill should show.

Then confirm the result back in one line before editing. For example: “Miami Guide (`miami-fl-usa`), featured from Nov 24 through Dec 6, so `displayEndAt` is `2026-12-07T00:00:00Z`.” The end is exclusive (see the doc), so `displayEndAt` is midnight UTC the day after the last day. The start must come before the end.

## 2. Before editing

- Read the current `FEATURED_CITY_GUIDE` in `featuredCityGuides.ts`. If its window hasn’t ended yet, tell the developer you’re cutting it short and get a yes before replacing it, because only one guide can be featured.
- Match the title style of recent changes (`git log -p -3 -- src/schema/v2/homeView/sections/featuredCityGuides.ts`). Recent titles are short, such as “Miami Guide” and “NYC Guide”.

## 3. Edit

Change only the `FEATURED_CITY_GUIDE` entry. Update its one-line comment to name the event and its real dates (for example `// Miami, Nov 24–Dec 6 2026`), which can differ from the promotion window.

## 4. Verify

1. Run `yarn type-check`. It rejects a slug that isn’t in `CITIES_WITH_GUIDES`.
2. Run `yarn jest src/schema/v2/homeView/sections/__tests__/QuickLinks.test.ts`. The tests mock the featured guide, so they won’t catch a wrong date. Check the dates by reading the diff.
3. If the window has started, run the `live-check` skill:

   ```graphql
   {
     homeView {
       section(id: "home-view-section-quick-links") {
         ... on HomeViewSectionNavigationPills {
           navigationPills {
             title
             href
             isFeatured
           }
         }
       }
     }
   }
   ```

   Expect the new guide as the first pill, with `isFeatured: true` and `href` set to `/city-guide?citySlug=<slug>`. If the window hasn’t started, say so and skip this step.

## 5. PR

Use a title like `feat(home-view): feature <City> city guide instead of <previous city>`. In the body, state the window in plain dates and note that the end is exclusive.
