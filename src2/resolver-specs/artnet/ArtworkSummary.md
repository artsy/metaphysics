# ArtworkSummary type

## Field mapping: special cases

- `classifications`: `classification`
- `objectTypes`: `objectType`
- `media`: values of the `materials` entities, falling back to `mediumRaw`
- `id`, `lastUpdated`, `uri`: not in the API artwork object; derived from the parent listing (`id` is `<listing id>:artwork:<index>`)
- `creator`: see CreatorSummary.md. `movements` comes from the artwork's `movement`, and `attributionQualifier` from the creator's `modifier`
