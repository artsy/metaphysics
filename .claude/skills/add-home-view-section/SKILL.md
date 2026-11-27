---
name: add-home-view-section
description: Add a new home view section (instance) or section type to the Eigen home view in Metaphysics. Use for any task that adds, reorders, flags or experiments with home view sections.
---

# Add a home view section

The docs are the source of truth. This skill doesn’t repeat their steps, so it can’t drift from them.

## 1. Read the docs first

Read [docs/adding_a_new_home_view_section.md](../../../docs/adding_a_new_home_view_section.md) in full and follow its steps in order. If the task also involves the following, read these:

- An A/B test of sections: [docs/adding_a_new_home_view_experiment.md](../../../docs/adding_a_new_home_view_experiment.md)
- Reordering sections by rule: [docs/home_view_mixer.md](../../../docs/home_view_mixer.md)
- Rolling out behind a flag: [docs/feature-flags.md](../../../docs/feature-flags.md)

Then read the two annotated templates the doc points to, because their comments describe every field:

- `src/schema/v2/homeView/sections/_ExampleSection.ts`
- `src/schema/v2/homeView/sectionTypes/_ExampleSectionType.ts` (only if no existing section type returns the same kind of data)

If the code and the doc disagree (a moved file, a renamed helper), follow the code, and tell the developer which line of the doc is stale so they can fix it in the same PR.

## 2. What the doc leaves out

- **Reuse a section type when you can.** Check `src/schema/v2/homeView/sectionTypes/` before you create one. Most new sections are a new instance of an existing type, such as an artworks rail.
- **Roll out behind a flag.** Set `featureFlag` to an Unleash flag declared in `src/lib/featureFlags.ts`. `helpers/isSectionDisplayable.ts` hides the section while the flag is off. For other conditions, use `shouldBeDisplayed(context)`, and use `minimumEigenVersion` when older apps can’t render the section.
- **Analytics.** `contextModule` and `ownerType` must already exist in `@artsy/cohesion`. Leave them out until Cohesion ships the value. Don’t invent one.
- **Performance.** Wrap the resolver in `withHomeViewTimeout`. If the section returns a connection, fetch the whole page in one call (see the N+1 section in `AGENTS.md`).
- **Keep lists alphabetical** in `sectionTypes/names.ts`, `sectionTypes/index.ts` and `sections/index.ts`. Only the zone’s `SECTIONS` array is ordered by display position.

## 3. Verify

1. Copy the closest test in `src/schema/v2/homeView/sections/__tests__/` and assert both the section’s metadata (type, component, analytics) and its data.
2. Run `yarn dump:local` and commit `_schemaV2.graphql` if the schema changed. A new section type changes it. A new instance usually doesn’t.
3. Run `yarn jest src/schema/v2/homeView`, `yarn type-check` and `yarn lint`.
4. Run the `live-check` skill with the queries from the doc: `homeView { section(id: "home-view-section-…") { … } }`, then `sectionsConnection` to confirm the position in the zone. If the section is flagged, check it both with the flag on and with it off.
