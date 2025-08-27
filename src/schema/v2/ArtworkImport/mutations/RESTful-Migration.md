# RESTful Artwork Import Mutations - Migration Guide

## Overview

This guide documents the migration from action-based to RESTful GraphQL mutation patterns for artwork imports. Both mutation styles are available simultaneously for zero-downtime migration.

---

## Mutations With No Changes

The following mutations remain unchanged and continue to work as before:

- `createArtworkImport` - Create new artwork import
- `updateArtworkImport` - Update import location (basic properties)

---

## Mutations Requiring Changes

### 1. Cancel Import

#### Current Usage (DEPRECATED)

```graphql
mutation {
  cancelArtworkImport(input: { artworkImportID: "import-123" }) {
    cancelArtworkImportOrError {
      ... on CancelArtworkImportSuccess {
        artworkImport {
          state
        }
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  updateArtworkImportV2(
    input: { artworkImportID: "import-123", status: "cancelled" }
  ) {
    updateArtworkImportV2OrError {
      ... on UpdateArtworkImportV2Success {
        artworkImport {
          state
        }
      }
    }
  }
}
```

**Migration Notes:** Action moved to resource-based update with status parameter.

---

### 2. Update Row Field

#### Current Usage (DEPRECATED)

```graphql
mutation {
  updateArtworkImportRow(
    input: {
      artworkImportID: "import-123"
      artworkImportRowID: "row-456"
      fieldName: "ArtworkTitle"
      fieldValue: "New Title"
    }
  ) {
    updateArtworkImportRowOrError {
      ... on UpdateArtworkImportRowSuccess {
        success
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  updateArtworkImportRowV2(
    input: {
      artworkImportID: "import-123"
      rowID: "row-456"
      fieldName: "ArtworkTitle"
      fieldValue: "New Title"
    }
  ) {
    updateArtworkImportRowV2OrError {
      ... on UpdateArtworkImportRowV2Success {
        artworkImportID
      }
    }
  }
}
```

**Migration Notes:** Parameter name changed from `artworkImportRowID` to `rowID`. Single endpoint handles both field updates and exclusion changes.

---

### 3. Toggle Row Exclusion

#### Current Usage (DEPRECATED)

```graphql
mutation {
  toggleArtworkImportRowExclusion(
    input: {
      artworkImportID: "import-123"
      artworkImportRowID: "row-456"
      excludedFromImport: true
    }
  ) {
    toggleArtworkImportRowExclusionOrError {
      ... on ToggleArtworkImportRowExclusionSuccess {
        artworkImport {
          state
        }
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  updateArtworkImportRowV2(
    input: {
      artworkImportID: "import-123"
      rowID: "row-456"
      excludedFromImport: true
    }
  ) {
    updateArtworkImportRowV2OrError {
      ... on UpdateArtworkImportRowV2Success {
        artworkImportID
      }
    }
  }
}
```

**Migration Notes:** Consolidated with row updates endpoint. Can combine field updates and exclusion in single mutation.

---

### 4. Create Artworks

#### Current Usage (DEPRECATED)

```graphql
mutation {
  createArtworkImportArtworks(input: { artworkImportID: "import-123" }) {
    createArtworkImportArtworksOrError {
      ... on CreateArtworkImportArtworksSuccess {
        created
        errors
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  createArtworkImportArtworksV2(input: { artworkImportID: "import-123" }) {
    createArtworkImportArtworksV2OrError {
      ... on CreateArtworkImportArtworksV2Success {
        createdArtworksCount
      }
    }
  }
}
```

**Migration Notes:** Response field renamed from `created` to `createdArtworksCount`. `errors` field removed.

---

### 5. Artist Matching

#### Current Usage (DEPRECATED)

```graphql
mutation {
  matchArtworkImportArtists(input: { artworkImportID: "import-123" }) {
    matchArtworkImportArtistsOrError {
      ... on MatchArtworkImportArtistsSuccess {
        matched
        unmatched
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  createArtworkImportArtistMatchV2(input: { artworkImportID: "import-123" }) {
    createArtworkImportArtistMatchV2OrError {
      ... on CreateArtworkImportArtistMatchV2Success {
        matchedArtistsCount
      }
    }
  }
}
```

**Migration Notes:** Response fields changed from `matched`/`unmatched` to `matchedArtistsCount`. Unmatched count no longer returned.

---

### 6. Assign Artist

#### Current Usage (DEPRECATED)

```graphql
mutation {
  assignArtworkImportArtist(
    input: {
      artworkImportID: "import-123"
      artistName: "Unknown Artist"
      artistID: "artist-789"
    }
  ) {
    assignArtworkImportArtistOrError {
      ... on AssignArtworkImportArtistSuccess {
        updatedRowsCount
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  createArtworkImportArtistAssignmentV2(
    input: {
      artworkImportID: "import-123"
      artistName: "Unknown Artist"
      artistID: "artist-789"
    }
  ) {
    createArtworkImportArtistAssignmentV2OrError {
      ... on CreateArtworkImportArtistAssignmentV2Success {
        updatedRowsCount
      }
    }
  }
}
```

**Migration Notes:** Same parameters and response, just updated naming convention.

---

### 7. Match Image

#### Current Usage (DEPRECATED)

```graphql
mutation {
  matchArtworkImportRowImage(
    input: {
      artworkImportID: "import-123"
      fileName: "image.jpg"
      s3Key: "uploads/image.jpg"
      s3Bucket: "my-bucket"
      rowID: "row-456"
    }
  ) {
    matchArtworkImportRowImageOrError {
      ... on MatchArtworkImportRowImageSuccess {
        success
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  createArtworkImportImageMatchV2(
    input: {
      artworkImportID: "import-123"
      fileName: "image.jpg"
      s3Key: "uploads/image.jpg"
      s3Bucket: "my-bucket"
      rowID: "row-456"
    }
  ) {
    createArtworkImportImageMatchV2OrError {
      ... on CreateArtworkImportImageMatchV2Success {
        success
      }
    }
  }
}
```

**Migration Notes:** Same parameters and response, follows resource collection naming.

---

### 8. Remove Image

#### Current Usage (DEPRECATED)

```graphql
mutation {
  removeArtworkImportImage(
    input: {
      artworkImportID: "import-123"
      rowID: "row-456"
      imageID: "image-789"
    }
  ) {
    removeArtworkImportImageOrError {
      ... on RemoveArtworkImportImageSuccess {
        success
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  removeArtworkImportImageMatchV2(
    input: { artworkImportID: "import-123", imageID: "image-789" }
  ) {
    removeArtworkImportImageMatchV2OrError {
      ... on RemoveArtworkImportImageMatchV2Success {
        success
      }
    }
  }
}
```

**Migration Notes:** `rowID` parameter removed - no longer needed in RESTful version.

---

### 9. Flag Cell

#### Current Usage (DEPRECATED)

```graphql
mutation {
  flagArtworkImportCell(
    input: {
      artworkImportID: "import-123"
      rowID: "row-456"
      columnName: "ArtworkTitle"
      userNote: "Suspicious value"
      flaggedValue: "Problem Title"
      originalValue: "Original Title"
    }
  ) {
    flagArtworkImportCellOrError {
      ... on FlagArtworkImportCellSuccess {
        artworkImport {
          state
        }
      }
    }
  }
}
```

#### New V2 Usage

```graphql
mutation {
  createArtworkImportCellFlagV2(
    input: {
      artworkImportID: "import-123"
      rowID: "row-456"
      columnName: "ArtworkTitle"
      flaggedValue: "Problem Title"
      originalValue: "Original Title"
      userNote: "Suspicious value"
    }
  ) {
    createArtworkImportCellFlagV2OrError {
      ... on CreateArtworkImportCellFlagV2Success {
        success
      }
    }
  }
}
```

**Migration Notes:** Same parameters, follows resource collection naming. Response changed to simple success boolean.

---

### 10. Bulk Updates (Currency, Dimensions, Weight)

#### Current Usage (DEPRECATED)

```graphql
# Separate mutations for each metric type
mutation {
  updateArtworkImportCurrency(input: {
    artworkImportID: "import-123"
    fromCurrency: "USD"
    toCurrency: "EUR"
  }) { ... }
}

mutation {
  updateArtworkImportDimensionMetric(input: {
    artworkImportID: "import-123"
    fromDimensionMetric: "in"
    toDimensionMetric: "cm"
  }) { ... }
}

mutation {
  updateArtworkImportWeightMetric(input: {
    artworkImportID: "import-123"
    fromWeightMetric: "lb"
    toWeightMetric: "kg"
  }) { ... }
}
```

#### New V2 Usage

```graphql
# Single unified mutation
mutation {
  updateArtworkImportV2(
    input: {
      artworkImportID: "import-123"
      currency: "EUR"
      dimensionMetric: "cm"
      weightMetric: "kg"
    }
  ) {
    updateArtworkImportV2OrError {
      ... on UpdateArtworkImportV2Success {
        artworkImport {
          currency
          dimensionMetric
          weightMetric
        }
      }
    }
  }
}
```

**Migration Notes:** Major simplification - set desired values directly instead of from/to pattern. Single mutation handles all bulk updates. More idempotent and avoids edge cases.

---

## Key Migration Patterns

### 1. Naming Conventions

- **V2 suffix**: All new mutations end with `V2`
- **Singular resource names**: Clear, singular resource naming (`createArtworkImportArtistMatchV2`, `createArtworkImportCellFlagV2`)
- **Consistent parameters**: `rowID` instead of `artworkImportRowID`

### 2. Response Changes

- **Simplified responses**: Many mutations return simpler success indicators
- **Consistent structure**: All V2 mutations follow similar response patterns
- **Better error handling**: Unified error response structure

### 3. New Capabilities

- **Combined operations**: Single mutation can handle multiple related changes
- **Simplified bulk updates**: Direct value setting instead of transformation patterns
- **Idempotent operations**: Safe to retry V2 mutations

---

## Implementation Strategy

### Phase 1: Gradual Migration

1. Update one mutation at a time in your application
2. Test thoroughly with the new V2 mutations
3. Both old and new mutations work simultaneously

### Phase 2: Full Migration

1. Replace all deprecated mutations with V2 equivalents
2. Update error handling for new response structures
3. Leverage new combined operation capabilities

### Phase 3: Cleanup

1. Remove deprecated mutation usage
2. Update documentation and examples
3. Optimize with new bulk update patterns

---

## Testing

All V2 mutations have comprehensive test coverage and maintain feature parity with deprecated versions while providing improved RESTful semantics.
