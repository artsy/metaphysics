/* eslint-disable require-yield */

import { FieldNode, visit, FragmentDefinitionNode } from "graphql"

export const hasFieldSelection = (
  fieldNode: Readonly<FieldNode>,
  fragments: [FragmentDefinitionNode],
  match: (nodeName: string, depth: number) => boolean
): boolean => {
  let matched: boolean = false
  visit(fieldNode, {
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
  fieldNode: Readonly<FieldNode>,
  fragments: [FragmentDefinitionNode],
  fields: string[]
): boolean => {
  return hasFieldSelection(fieldNode, fragments, (nodeName, _depth) =>
    fields.includes(nodeName)
  )
}
