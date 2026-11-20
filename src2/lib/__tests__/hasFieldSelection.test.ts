import {
  parse,
  GraphQLResolveInfo,
  FragmentDefinitionNode,
  FieldNode,
} from "graphql"
import gql from "lib/gql"
import {
  hasFieldSelection,
  hasIntersectionWithSelectionSet,
  includesFieldsOtherThanSelectionSet,
  isSkipped,
} from "lib/hasFieldSelection"

const fragments = parse(gql`
  fragment Start on Artist {
    artwork {
      id
      ...TestFragmentVisitation
    }
    ...TestMergedFieldSelection
    ...TestSkippedValue
  }
  fragment TestMergedFieldSelection on Artist {
    artwork {
      edition_sets {
        id
        testField
      }
    }
  }
  fragment TestFragmentVisitation on Artwork {
    edition_of
  }
  fragment TestSkippedValue on Artwork {
    title @skip(if: true)
  }
`).definitions as FragmentDefinitionNode[]

const info: GraphQLResolveInfo = {
  fieldNodes: [
    fragments[0].selectionSet.selections[0] as FieldNode,
    fragments[1].selectionSet.selections[0] as FieldNode,
  ],
  fragments: fragments.reduce(
    (acc, fragment) => ({ ...acc, [fragment.name.value]: fragment }),
    {}
  ),
} as any

describe("hasFieldSelection", () => {
  it("returns if it has selections from the received field nodes", () => {
    expect(hasFieldSelection(info, (n) => n === "id")).toEqual(true)
    expect(hasFieldSelection(info, (n) => n === "edition_sets")).toEqual(true)
  })

  it("returns if it has selections from any spread in fragments", () => {
    expect(hasFieldSelection(info, (n) => n === "edition_of")).toEqual(true)
  })

  it("returns that no such field selection exists", () => {
    expect(hasFieldSelection(info, (n) => n === "something-else")).toEqual(
      false
    )
  })
})

describe("hasIntersectionWithSelectionSet", () => {
  it("returns true when any of the entries in the specified set exist in the selection set", () => {
    expect(
      hasIntersectionWithSelectionSet(info, ["edition_of", "something-else"])
    ).toEqual(true)
  })
  it("returns false when none of the entries in the specified set exist in the selection set", () => {
    expect(hasIntersectionWithSelectionSet(info, ["something-else"])).toEqual(
      false
    )
  })
})

describe("includesFieldsOtherThanSelectionSet", () => {
  it("returns true when the specified set contains entries that do not exist in the selection set", () => {
    expect(
      includesFieldsOtherThanSelectionSet(info, ["edition_of", "random"])
    ).toEqual(true)
  })

  it("returns false when not asked for other fields other than filters", () => {
    expect(
      includesFieldsOtherThanSelectionSet(info, [
        "id",
        "edition_of",
        "edition_sets",
      ])
    ).toEqual(false)
  })
})

describe("isSkipped", () => {
  it("returns the value of the skip directive", () => {
    const directives = fragments[3].selectionSet.selections[0].directives
    expect(isSkipped({ directives, info })).toEqual(true)
  })
  it("returns false without skip directive", () => {
    const directives = fragments[2].selectionSet.selections[0].directives
    expect(isSkipped({ directives, info })).toEqual(false)
  })
})
