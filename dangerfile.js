// @flow

import { danger, fail, warn } from "danger"

// Make sure we're using the assignee system so that
// our slack bot works correctly.
const someoneAssigned = danger.github.pr.assignee
if (someoneAssigned === null) {
  fail("Please assign someone to merge this PR, and optionally include people who should review.")
}

// Move all JS files towards using flow
const changedFiles = danger.git.created_files.concat(danger.git.modified_files)

// Request a CHANGELOG entry, but allow a PR to say it doesn't neeed one
const hasChangelog = changedFiles.includes("changelog.md")
const declaredTrivial = danger.pr.title.indexOf("trivial") !== -1

if (!hasChangelog && !declaredTrivial) {
  fail("Please add a changelog entry noting your changes.")
}

// Politely ask for their name on the entry too
if (hasChangelog) {
  const changelogDiff = danger.git.diffForFile("changelog.md")
  const contributorName = danger.github.pr.user.login
  if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
    warn("Please add your GitHub name (\"" + contributorName + "\") to the changelog entry.")
  }
}
