## Adding a new Home View Section

Before creating a new section, please check first if there is an existing section that returns the same data on the home view. _Make sure to also check hidden sections_. If there is one 🎉, you can skip to Step 3.

**1. Add a new `HomeViewSection` type.**

```typescript
export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [
    MyNewHomeViewSection, // 👈 Add your new type here
    ...
  ],
  resolveType: (value) => {
    return value.type
  },
})
```

**2. Define your new home view section type.**

```typescript
const ArtworksRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MyNewHomeViewSection",
  description: "A relevant description of your new section",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    // 👇 Add your new fields here
    myNewField: MyNewFieldType,
  },
})
```

**3. Define your new section inside `homeView/sections.ts`**

```typescript
export const MyNewHomeViewSectionName: HomeViewSection = {
  id: "home-view-section-[name-of-the-new-section]",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Recently viewed works",
  },
  resolver: RecentlyViewedArtworksResolver,
}
```

- Note: If you don't prefix the id with `home-view-section-`, it might break deep linking in App.

**4. Add the new section resolver. If you are creating a new section, create a new file for it. Otherwise, use the existing home section types resolvers.**

Example 1: If you want to add a new artworks rail section to the existing `ArtworksRailHomeViewSection`, you need to add its resovler to `homeView/artworkResolvers.ts`
Example 2: If you want to add a new section that for a new type, you need to add its resovler to `homeView/newSectionResolvers.ts`

**5. In order to expose your section to client apps:**

- Add your new section to the `sections` array in `homeView/getSectionsForUser.ts` and define the order you want to display it at. In the exmaple below, we are adding the new section at the end of the list if you are a regular user, and at the beginning of the list if you are an admin.

```typescript
export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSection[]> {
  ...
  let sections: HomeViewSection[] = []

  if (me.type === "Admin") {
    sections = [
      MyNewHomeViewSectionName, // 👈 Add your new section here
      ...
    ]
  } else {
    sections = [
      ...
      MyNewHomeViewSectionName, // 👈 Add your new section here
    ]
  }

  return sections
}
```

- Add section the list of sections in `homeView/sections.ts`

```typescript
// 👇 This will expose your section to homeView > section(id: "home-view-section-[name-of-the-new-section]")
const sections: HomeViewSection[] = [
  RecentlyViewedArtworks,
  AuctionLotsForYou,
  NewWorksForYou,
  TrendingArtists,
]
```

If you want to see a PR where this comes together, check out [TODO: Add PR link here]().
