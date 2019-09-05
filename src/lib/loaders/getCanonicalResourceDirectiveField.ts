import { FieldNode, visit, BREAK } from "graphql"

export const getCanonicalResourceDirectiveForField = (
  fieldNode: FieldNode
): string[] => {
  const path: string[] = []
  visit(fieldNode, {
    Field: {
      enter(node) {
        path.push(node.name.value)
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
