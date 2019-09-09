import { visit, BREAK, DocumentNode } from "graphql"

export const getPrincipalFieldDirectivePath = (
  documentNode: DocumentNode
): string[] => {
  const path: string[] = []
  visit(documentNode, {
    Field: {
      enter(node) {
        const name = (node.alias || node.name).value
        path.push(name)
      },
      leave() {
        path.pop()
      },
    },
    Directive(node) {
      if (node.name.value === "principalField") {
        return BREAK
      }
    },
  })

  return path
}
