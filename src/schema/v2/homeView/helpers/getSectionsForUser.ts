import { ResolverContext } from "types/graphql"
import { getSections } from "../zones/default"
import { HomeViewSection } from "../sections/"

export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSection[]> {
  const sections = await getSections(context)

  return [
    ...sections,
    // other zones’ sections TK
  ]
}
