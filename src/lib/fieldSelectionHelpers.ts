/* eslint-disable require-yield */

import { FieldNode, visit, FragmentDefinitionNode } from "graphql"

export const hasFieldSelection = (
  fieldNode: Readonly<FieldNode | FragmentDefinitionNode>,
  fragments: { [key: string]: FragmentDefinitionNode },
  match: (nodeName: string, depth: number) => boolean
): boolean => {
  if (!fieldNode) return false
  let matched: boolean = false
  visit(fieldNode.selectionSet!.selections, {
    Field(node, _key, _parent, path, _ancestors) {
      if (match(node.name.value, path.length)) {
        matched = true
        return false
      }
    },
    FragmentSpread(node) {
      const fragmentDef = fragments[node.name.value]
      matched = hasFieldSelection(fragmentDef, fragments, match)
    },
  })
  return matched
}

export const includesFieldsSelection = (
  fieldNode: Readonly<FieldNode | FragmentDefinitionNode>,
  fragments: { [key: string]: FragmentDefinitionNode },
  fields: string[]
): boolean => {
  return hasFieldSelection(
    fieldNode,
    fragments,
    (nodeName, depth) => depth <= 1 && fields.includes(nodeName)
  )
}

export const includesOtherFieldsSelection = (
  fieldNode: Readonly<FieldNode | FragmentDefinitionNode>,
  fragments: { [key: string]: FragmentDefinitionNode },
  fields: string[]
): boolean => {
  return hasFieldSelection(
    fieldNode,
    fragments,
    (nodeName, depth) => depth <= 1 && !fields.includes(nodeName)
  )
}
