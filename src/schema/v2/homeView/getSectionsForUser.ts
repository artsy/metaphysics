import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "./sections"
import { getLegacyZoneSections } from "./zones/legacy"

export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSection[]> {
  const legacyZoneSections = await getLegacyZoneSections(context)

  return [
    ...legacyZoneSections,
    // other zones’ sections TK
  ]
}
