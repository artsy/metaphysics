/* eslint-disable require-yield */

import {
  FieldNode,
  visit,
  FragmentDefinitionNode,
  BREAK,
  GraphQLResolveInfo,
} from "graphql"

export const hasFieldSelection = (
  resolveInfo: GraphQLResolveInfo,
  match: (nodeName: string) => boolean
): boolean => {
  if (!resolveInfo.fieldNodes) return false
  const firstFieldNode = resolveInfo.fieldNodes[0]

  let matched: boolean = false

  const visitor = (
    fieldNode: FieldNode | FragmentDefinitionNode,
    fragments?: { [key: string]: FragmentDefinitionNode }
  ): void => {
    visit(fieldNode, {
      Field(node, _key, _parent, path, _ancestors) {
        if (path.length > 3) {
          return false
        }
        if (path.length === 3 && match(node.name.value)) {
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
  visitor(firstFieldNode)
  return matched
}

export const hasIntersectionWithSelectionSet = (
  resolveInfo: GraphQLResolveInfo,
  fields: string[]
): boolean => {
  return hasFieldSelection(resolveInfo, nodeName => fields.includes(nodeName))
}

export const includesFieldsOtherThanSelectionSet = (
  resolveInfo: GraphQLResolveInfo,
  fields: string[]
): boolean => {
  return hasFieldSelection(resolveInfo, nodeName => !fields.includes(nodeName))
}
