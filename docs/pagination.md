# Pagination

Paginating is done inconstently and, often, incorrectly throughout this codebase. Avoid blindly copy-pasting an implementation from somewhere else.

### What's needed:

#### 1. Connection Type

A connection type for the `type` field. Use `connectionWithCursorInfo` to generate this. It returns an object with `connectionType` on it.

```tsx
import { connectionWithCursorInfo } from "../fields/pagination"

type: connectionWithCursorInfo({ nodeType: ExampleType }).connectionType
```

#### 2. Pageable Arguments

There's a `pageable` helper for generating the required pagination arguments. In addition to this we'd like to support page/per style pagination.

```ts
import { pageable } from "relay-cursor-paging"

// ...

args: pageable({
  page: { type: GraphQLInt },
  size: { type: GraphQLInt },
  // You can add additional arguments here...
})
```

#### 3. Loader

Your data loader should pass `{ headers: true }`. When using it, pass `total_count: true` and pull out the headers to get the total count.

```ts
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

// ...

const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
const { body, headers } = await exampleLoader({
  size,
  offset,
  total_count: true,
})
const totalCount = parseInt(headers["x-total-count"] || "0", 10)
```

#### 4. Resolver

Ultimately pass this all to a `paginationResolver`

```ts
import { paginationResolver } from "../fields/pagination"

// ...

return paginationResolver({ totalCount, offset, page, size, body, args })
```
