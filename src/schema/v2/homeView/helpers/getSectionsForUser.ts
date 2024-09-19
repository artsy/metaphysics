import { ResolverContext } from "types/graphql"
import { getSections as getDiscoverySections } from "../zones/discovery"
import { getSections as getNextSections } from "../zones/next"
import { getSections as getLegacySections } from "../zones/legacy"
import { HomeViewSection } from "../sections/"

const zones = {
  legacy: getLegacySections,
  next: getNextSections,
  discovery: getDiscoverySections,
}

export async function getSectionsForUser(
  context: ResolverContext,
  zoneID = "legacy"
): Promise<HomeViewSection[]> {
  const getSections = zones[zoneID]

  if (!getSections) {
    throw new Error(`Unknown zone ID: ${zoneID}`)
  }

  const sections = await getSections(context)

  return sections
}
