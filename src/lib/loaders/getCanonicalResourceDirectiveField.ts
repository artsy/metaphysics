import { FieldNode, visit, BREAK } from "graphql"

export const getCanonicalResourceDirectiveForField = (
  fieldNode: FieldNode
): string | undefined => {
  let field: string | undefined
  // let fullPath: string[] = []
  visit(fieldNode, {
    // SelectionSet(node, _key, _parent, _path, _ancestors) {
    //   node.selections.map(selection => {
    //     if (selection.kind === "Field") {
    //       if (selection.directives && selection.directives.length) {
    //         if (selection.directives[0].name.value === "canonicalResource") {
    //           fullPath.push(selection.name.value)
    //         }
    //       }
    //     }
    //   })

    //   return
    // },
    Directive(node, _key, _parent, _path, ancestors) {
      if (node.name.value === "canonicalResource") {
        const containingField = ancestors.slice(-1)[0] as FieldNode
        field = containingField.name.value
        return BREAK
      }
    },
  })

  return field
}
