import { parse } from "graphql"
import gql from "lib/gql"
import {
  hasFieldSelection,
  includesFieldsSelection,
  includesOtherFieldsSelection,
} from "lib/hasFieldSelection"

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
    const matchByName = nodeName => nodeName === "edition_of"
    expect(
      hasFieldSelection({ fieldNodes: [firstNode], fragments }, matchByName)
    ).toEqual(true)

    const matchByRandomName = nodeName => nodeName === "random"
    expect(
      hasFieldSelection(
        { fieldNodes: [firstNode], fragments },
        matchByRandomName
      )
    ).toEqual(false)
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
      includesFieldsSelection({ fieldNodes: [firstNode], fragments }, [
        "edition_of",
        "random",
      ])
    ).toEqual(true)

    expect(
      includesFieldsSelection({ fieldNodes: [firstNode], fragments }, [
        "random",
      ])
    ).toEqual(false)
  })
})

describe("includesOtherFieldsSelection", () => {
  it("returns true when asked for other fields other than filtered", () => {
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
      includesOtherFieldsSelection({ fieldNodes: [firstNode], fragments }, [
        "edition_of",
        "random",
      ])
    ).toEqual(true)
  })

  it("returns false when not asked for other fields other than filters", () => {
    const ast = parse(gql`
      fragment Start on Artwork {
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
      includesOtherFieldsSelection({ fieldNodes: [firstNode], fragments }, [
        "edition_of",
        "edition_sets",
      ])
    ).toEqual(false)
  })
})
