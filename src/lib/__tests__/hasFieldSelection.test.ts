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

const multipleFieldNodes = parse(gql`
  query {
    viewer {
      ...CollectApp_viewer_3XOIsA
    }
  }

  fragment CollectApp_viewer_3XOIsA on Viewer {
    filter_artworks(aggregations: [MEDIUM, TOTAL], size: 0) {
      __id
    }
    ...CollectFilterContainer_viewer_3XOIsA
  }

  fragment CollectFilterContainer_viewer_3XOIsA on Viewer {
    filter_artworks(aggregations: [MEDIUM, TOTAL], size: 0) {
      aggregations {
        slice
        counts {
          name
          id
          __id
        }
      }
      __id
    }
  }
`)

const [
  query,
  firstFragment,
  secondFragment,
] = multipleFieldNodes.definitions as any

let fragmentDefs = [firstFragment, secondFragment]
let multipleFieldNodesFragments = {}

fragmentDefs.map(node => {
  multipleFieldNodesFragments[node.name.value] = node
})

const multipleFieldNodesInfo: GraphQLResolveInfo = {
  fieldNodes: [query, secondFragment],
  fragments: multipleFieldNodesFragments,
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
      includesFieldsOtherThanSelectionSet(multipleFieldNodesInfo, [
        "edition_of",
        "random",
      ])
    ).toEqual(true)
  })

  it("returns false when not asked for other fields other than filters", () => {
    expect(
      includesFieldsOtherThanSelectionSet(multipleFieldNodesInfo, [
        "__id",
        "aggregations",
      ])
    ).toEqual(false)
  })
})
