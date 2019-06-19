/* eslint-disable require-yield */

import {
  FieldNode,
  visit,
  FragmentDefinitionNode,
  BREAK,
  GraphQLResolveInfo,
} from "graphql"

const SELECTION_DEPTH_THRESHOLD = 3

export const hasFieldSelection = (
  resolveInfo: GraphQLResolveInfo,
  match: (fieldName: string) => boolean
): boolean => {
  if (!resolveInfo.fieldNodes) return true

  return resolveInfo.fieldNodes.some(rootNode => {
    let matched: boolean = false

    const visitor = (
      fieldNode: FieldNode | FragmentDefinitionNode,
      fragments?: { [key: string]: FragmentDefinitionNode }
    ): void => {
      visit(fieldNode, {
        Field(node, _key, _parent, path, _ancestors) {
          // Stop recursion for nodes deeper than our threshold
          if (path.length > SELECTION_DEPTH_THRESHOLD) {
            return false
          }
          if (
            path.length === SELECTION_DEPTH_THRESHOLD &&
            match(node.name.value)
          ) {
            matched = true
            return BREAK
          }
        },
        FragmentSpread(node) {
          const fragmentDef = resolveInfo.fragments[node.name.value]
          visitor(fragmentDef, fragments)
        },
      })
    }
    visitor(rootNode)

    return matched
  })
}

export const hasIntersectionWithSelectionSet = (
  resolveInfo: GraphQLResolveInfo,
  fieldNames: string[]
): boolean => {
  return hasFieldSelection(resolveInfo, nodeName =>
    fieldNames.includes(nodeName)
  )
}

export const includesFieldsOtherThanSelectionSet = (
  resolveInfo: GraphQLResolveInfo,
  fieldNames: string[]
): boolean => {
  return hasFieldSelection(
    resolveInfo,
    nodeName => !fieldNames.includes(nodeName)
  )
}
