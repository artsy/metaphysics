## Adding a new Home View Section

Before creating a new section, please check first if there is an existing section that returns the same data on the home view. _Make sure to also check hidden sections_. If there is one 🎉, you can skip to Step 3.

**1. Define your new section schema in [HomeViewSection.ts](../src/schema/v2/homeView/HomeViewSection.ts)**

```typescript
const MyNewHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: HomeViewSectionTypeNames.MyNewHomeViewSection,
  description: "A relevant description of your new section",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    // 👇 Add your new fields here
    myNewField: MyNewFieldType,
  },
})
```

**2. Make your section available as HomeViewSection in [HomeViewSection.ts](../src/schema/v2/homeView/HomeViewSection.ts)**

```typescript
export const homeViewSectionTypes: GraphQLObjectType<any, ResolverContext>[] = [
  ...,
  MyNewHomeViewSectionType, // 👈 Add your new type here
]
```

**3. Define section logic in [homeView/sections](../src/schema/v2/homeView/sections)**

```typescript
export const MyNewSection: HomeViewSection = {
  id: "home-view-section-[name-of-the-new-section]",
  type: "MyNewHomeViewSection",
  component: {
    title: "My New Section",
  },
  resolver: withHomeViewTimeout(),
  // 👇 Add your new resolver here
}
```

- Note: If you don't prefix the id with `home-view-section-`, it might break deep linking in App.

**5. Expose your section in the appropriate zone:**

> Currently, only legacy zone is supported.

- Add your new section to the `LEGACY_ZONE_SECTIONS` array in `homeView/zones/legacy.ts` and define the order you want to display it at.

```typescript
  MyNewSection, // 👈 Add your new section here if you want it to appear first
  ...
```

If you want to see a PR where this comes together, check out [TODO: Add PR link here]().
