# Feature Flags via Unleash

> Devs can manage feature flags via our internal tools app [tools.artsy.net/feature-flags](https://tools.artsy.net/feature-flags) or directly on [Unleash](https://unleash.artsy.net).

### Example

To use a feature flag toggle, import the helper and then check for enabled/disabled in the resolver:

```tsx
import { isFeatureFlagEnabled } from "lib/featureFlags"

const Artist = {
  type: ArtistType,
  description: "An Artist",
  args: {
    id: {
      description: "The slug or ID of the Artist",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { artistLoader }) => {
    const isArtistEnabled = isFeatureFlagEnabled("some-artist-flag")

    if (!isArtistEnabled) {
      return null
    }

    return artistLoader(id)
  },
}
```

If needing to pass addition unleash context info along, a second argument can be provided to the helper:

```ts
isFeatureFlagEnabled("some-artist-flag", {
  userId: "foo",
  sessionId: "bar",
})
```

See the [Unleash Context docs](https://docs.getunleash.io/reference/unleash-context) for more info.
