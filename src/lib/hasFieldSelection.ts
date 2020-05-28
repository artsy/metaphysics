/* eslint-disable require-yield */

import {
  FieldNode,
  visit,
  FragmentDefinitionNode,
  BREAK,
  GraphQLResolveInfo,
} from "graphql"
import { CursorPageable } from "relay-cursor-paging"

const SELECTION_DEPTH_THRESHOLD = 3

export const hasFieldSelection = (
  resolveInfo: GraphQLResolveInfo,
  match: (fieldName: string) => boolean
): boolean => {
  if (!resolveInfo.fieldNodes) return true

  return resolveInfo.fieldNodes.some((rootNode) => {
    let matched = false

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
  return hasFieldSelection(resolveInfo, (nodeName) =>
    fieldNames.includes(nodeName)
  )
}

export const includesFieldsOtherThanSelectionSet = (
  resolveInfo: GraphQLResolveInfo,
  fieldNames: string[]
): boolean => {
  return hasFieldSelection(
    resolveInfo,
    (nodeName) => !fieldNames.includes(nodeName)
  )
}

export const isSkipped = ({ directives, info }) => {
  if (!directives || !directives.length) return false

  let skipped = false
  directives.forEach((directive) => {
    if (directive.name.value === "skip") {
      directive.arguments &&
        directive.arguments.forEach((arg) => {
          if (arg.name.value === "if") {
            if (arg.value.kind === "Variable") {
              const variableName = arg.value.name.value
              skipped = info.variableValues[variableName]
            } else if (arg.value.kind === "BooleanValue") {
              skipped = arg.value.value
            }
            return
          }
        })
    }
  })
  return skipped
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
    info.fieldNodes.forEach((rootNode) => {
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
              if (isSkipped({ directives: node.directives, info })) return BREAK

              node.arguments &&
                node.arguments.forEach((arg) => {
                  if (
                    ["first", "last", "before", "after"].includes(
                      arg.name.value
                    )
                  ) {
                    let val: string

                    if (arg.value.kind === "Variable") {
                      const variableName = arg.value.name.value
                      val = info.variableValues[variableName]
                    } else if (
                      arg.value.kind === "IntValue" ||
                      arg.value.kind === "StringValue"
                    ) {
                      val = arg.value.value
                    } else {
                      val = "0"
                    }

                    connectionArgs[arg.name.value] = parseInt(val, 10) || val
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
