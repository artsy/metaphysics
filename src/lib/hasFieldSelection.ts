/* eslint-disable require-yield */

import {
  FieldNode,
  visit,
  FragmentDefinitionNode,
  BREAK,
  GraphQLResolveInfo,
} from "graphql"
import { CursorPageable } from "./helpers"

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

// If there's a nested collection being queried, this will return
// the pagination params. This might be useful in order to de-dupe
// or better batch requests. For instance, two queries only differing
// in pagination params could be consolidated.
// Currently used by `filter_artworks`.
export const parseConnectionArgsFromConnection = (
  info: GraphQLResolveInfo,
  connectionName: string
) => {
  const connectionArgs: CursorPageable = {}
  info.fieldNodes &&
    info.fieldNodes.forEach(rootNode => {
      const visitor = (
        fieldNode: FieldNode | FragmentDefinitionNode,
        fragments?: { [key: string]: FragmentDefinitionNode }
      ): void => {
        visit(fieldNode, {
          Field(node, _key, _parent, path, _ancestors) {
            // Stop recursion for nodes deeper than our threshold
            if (path.length > SELECTION_DEPTH_THRESHOLD) {
              return
            }
            if (
              path.length === SELECTION_DEPTH_THRESHOLD &&
              node.name.value === connectionName
            ) {
              node.arguments &&
                node.arguments.forEach(arg => {
                  if (
                    ["first", "last", "before", "after"].includes(
                      arg.name.value
                    )
                  ) {
                    const val = (arg as any).value.value
                      ? (arg as any).value.value
                      : 0

                    connectionArgs[arg.name.value] = parseInt(val) || val
                  }
                })
              return BREAK
            }
          },
          FragmentSpread(node) {
            const fragmentDef = info.fragments[node.name.value]
            visitor(fragmentDef, fragments)
          },
        })
      }

      visitor(rootNode)
    })

  return connectionArgs
}
