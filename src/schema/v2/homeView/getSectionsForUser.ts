import { ResolverContext } from "types/graphql"
import { getLegacyZoneSections } from "./zones/legacy"
import { HomeViewSection } from "./sections"

export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSection[]> {
  const legacyZoneSections = await getLegacyZoneSections(context)

  return [
    ...legacyZoneSections,
    // other zones’ sections TK
  ]
}
