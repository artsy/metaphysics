import { visit, DocumentNode } from "graphql"

export const getOptionalFieldsDirectivePaths = (
  documentNode: DocumentNode
): string[][] => {
  const paths: string[][] = []
  let path: string[] = []
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
      if (node.name.value === "optionalField") {
        paths.push([...path])
        path = []
      }
    },
  })

  return paths
}
