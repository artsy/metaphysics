import { parse, GraphQLResolveInfo } from "graphql"
import gql from "lib/gql"
import {
  hasFieldSelection,
  hasIntersectionWithSelectionSet,
  includesFieldsOtherThanSelectionSet,
} from "lib/hasFieldSelection"

const ast = parse(gql`
  fragment Start on Artwork {
    id
    ...TestEditionSet
  }
  fragment TestEditionSet on Artwork {
    edition_of
    edition_sets {
      id
    }
  }
`)

const [firstNode, ...otherNodes] = ast.definitions as any
let fragments = {}
otherNodes.map(node => {
  fragments[node.name.value] = node
})

const info: GraphQLResolveInfo = {
  fieldNodes: [firstNode],
  fragments: fragments,
} as any

describe("hasFieldSelection", () => {
  it("returns correct response based on match function", () => {
    const matchByName = nodeName => nodeName === "edition_of"
    expect(hasFieldSelection(info, matchByName)).toEqual(true)

    const matchByRandomName = nodeName => nodeName === "random"
    expect(hasFieldSelection(info, matchByRandomName)).toEqual(false)
  })
})

describe("hasIntersectionWithSelectionSet", () => {
  it("returns correct response based on match function", () => {
    expect(
      hasIntersectionWithSelectionSet(info, ["edition_of", "random"])
    ).toEqual(true)

    expect(hasIntersectionWithSelectionSet(info, ["random"])).toEqual(false)
  })
})

describe("includesFieldsOtherThanSelectionSet", () => {
  it("returns true when asked for other fields other than filtered", () => {
    expect(
      includesFieldsOtherThanSelectionSet(info, ["edition_of", "random"])
    ).toEqual(true)
  })

  it("returns false when not asked for other fields other than filters", () => {
    expect(
      includesFieldsOtherThanSelectionSet(info, [
        "edition_of",
        "edition_sets",
        "id",
      ])
    ).toEqual(false)
  })
})
