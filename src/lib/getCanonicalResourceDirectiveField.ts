import { visit, BREAK, DocumentNode } from "graphql"
import { get } from "lodash"

export const getCanonicalResourceDirectiveForField = (
  documentNode: DocumentNode
): string[] => {
  const path: string[] = []
  visit(documentNode, {
    Field: {
      enter(node) {
        const name = get(node, "alias.value") || node.name.value
        path.push(name)
      },
      leave() {
        path.pop()
      },
    },
    Directive(node) {
      if (node.name.value === "canonicalResource") {
        return BREAK
      }
    },
  })

  return path
}
