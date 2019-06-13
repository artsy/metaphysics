import { parse } from "graphql"
import gql from "lib/gql"
import {
  hasFieldSelection,
  includesFieldsSelection,
} from "lib/fieldSelectionHelpers"

describe("hasFieldSelection", () => {
  it("returns correct response based on match function", () => {
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

    const [firstNode, ...otherNodes] = ast.definitions
    let fragments = {}
    otherNodes.map(node => {
      fragments[node.name.value] = node
    })
    const matchByName = (nodeName, _depth) => nodeName === "edition_of"
    expect(hasFieldSelection(firstNode, fragments, matchByName)).toEqual(true)

    const matchByRandomName = (nodeName, _depth) => nodeName === "random"
    expect(hasFieldSelection(firstNode, fragments, matchByRandomName)).toEqual(
      false
    )

    const matchByDepth = (_nodeName, depth) => depth > 6
    expect(hasFieldSelection(firstNode, fragments, matchByDepth)).toEqual(false)
  })
})

describe("includesFieldsSelection", () => {
  it("returns correct response based on match function", () => {
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

    const [firstNode, ...otherNodes] = ast.definitions
    let fragments = {}
    otherNodes.map(node => {
      fragments[node.name.value] = node
    })
    expect(
      includesFieldsSelection(firstNode, fragments, ["edition_of", "random"])
    ).toEqual(true)

    expect(includesFieldsSelection(firstNode, fragments, ["random"])).toEqual(
      false
    )
  })
})
