import { createPageCursors } from "schema/fields/pagination"
import { fromGlobalId } from "graphql-relay"

function offsetFromCursor({ cursor }) {
  return fromGlobalId(cursor).id
}

function checkCursorArray(cursors, size) {
  // Offsets are the end of the previous page.
  let index
  for (index = 0; index < cursors.length; index++) {
    const { page } = cursors[index]
    expect(offsetFromCursor(cursors[index])).toBe(
      ((page - 1) * size - 1).toString()
    )
  }
}

describe("createPageCursors", () => {
  it("creates the proper structure for a short list", () => {
    const size = 10
    const pageCursors = createPageCursors({ page: 1, size }, 35)

    // All pages contained in `around`
    expect(pageCursors).not.toHaveProperty("first")
    expect(pageCursors).not.toHaveProperty("last")
    const { around } = pageCursors
    expect(around.length).toBe(4)

    // We are on the first page, and there is no previous page info.
    expect(around[0].isCurrent).toBe(true)
    expect(pageCursors).not.toHaveProperty("previous")

    checkCursorArray(around, size)
  })

  it("creates the proper structure when near the beginning of a long list", () => {
    const size = 10
    const pageCursors = createPageCursors({ page: 1, size }, 75)

    // There shouldn't be a `first` as it is contained in `around`.
    expect(pageCursors).not.toHaveProperty("first")

    // Last page starts at `70`.
    expect(offsetFromCursor(pageCursors.last)).toBe("69")

    const { around } = pageCursors
    expect(around.length).toBe(4)

    // We are on the first page, and there is no previous page info.
    expect(around[0].isCurrent).toBe(true)
    expect(pageCursors).not.toHaveProperty("previous")

    checkCursorArray(around, size)
  })

  it("creates the proper structure when near the middle of a long list", () => {
    const size = 10
    const pageCursors = createPageCursors({ page: 4, size }, 75)

    // First page starts at `0`.
    expect(offsetFromCursor(pageCursors.first)).toBe("-1")

    // Last page starts at `70`.
    expect(offsetFromCursor(pageCursors.last)).toBe("69")

    const { around, previous } = pageCursors
    expect(around.length).toBe(3)

    // We are on the fourth page.
    expect(around[1].page).toBe(4)
    expect(around[1].isCurrent).toBe(true)
    expect(previous.page).toBe(3)

    checkCursorArray(around, size)
  })

  it("creates the proper structure when near the end of a long list", () => {
    const size = 10
    const pageCursors = createPageCursors({ page: 7, size }, 75)

    // First page starts at `0`.
    expect(offsetFromCursor(pageCursors.first)).toBe("-1")

    // There shouldn't be a `last` as it is contained in `around`.
    expect(pageCursors).not.toHaveProperty("last")

    const { around, previous } = pageCursors
    expect(around.length).toBe(4)

    // We are on the seventh page.
    expect(around[2].page).toBe(7)
    expect(around[2].isCurrent).toBe(true)
    expect(previous.page).toBe(6)

    checkCursorArray(around, size)
  })

  it("creates the proper structure for an empty collection", () => {
    const size = 10
    const pageCursors = createPageCursors({ page: 7, size }, 0)

    // There shouldn't be a `first` or `last` as it is contained in `around`.
    expect(pageCursors).not.toHaveProperty("last")
    expect(pageCursors).not.toHaveProperty("first")
    expect(pageCursors).not.toHaveProperty("previous")

    const { around } = pageCursors
    expect(around.length).toBe(1)

    // We are on the first page.
    expect(around[0].page).toBe(1)
    expect(around[0].isCurrent).toBe(true)
    expect(offsetFromCursor(around[0])).toBe("-1")
  })

  it("caps the page number to 100", () => {
    const size = 10
    const totalPages = 101
    const totalRecords = totalPages * size

    const pageCursors = createPageCursors({ page: 1, size }, totalRecords)

    expect(pageCursors.last.page).toBe(100)
  })
})
