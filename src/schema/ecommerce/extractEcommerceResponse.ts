import { ExecutionResult } from "graphql"

import { ExecutionResultDataDefault } from "graphql/execution/execute"

export const extractEcommerceResponse = (key: string) => (
  result: ExecutionResult<ExecutionResultDataDefault>
) => {
  if (result.errors) {
    throw Error(result.errors.map(d => d.message).join("\n---\n"))
  }
  return result.data![key]
}
