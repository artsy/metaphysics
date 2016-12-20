// @flow

import { danger, fail, warn, markdown } from 'danger';
const fs = require('fs');

// Make sure we're using the assignee system so that
// our slack bot works correctly.
const someoneAssigned = danger.github.pr.assignee;
if (someoneAssigned === null) {
  fail('Please assign someone to merge this PR, and optionally include people who should review.');
}

// Move all JS files towards using flow
const changedFiles = danger.git.created_files.concat(danger.git.modified_files);
const unFlowedFiles = changedFiles.filter(path => !path.startsWith('test/') && path.endsWith('js'))
  .filter(filepath => {
    const content = fs.readFileSync(filepath);
    return content.includes('@flow');
  });

if (unFlowedFiles.length > 0) {
  const flowLinks = [
    ' * [Main Site](https://flowtype.org)',
    ' * [Types](https://flowtype.org/docs/quick-reference.html#primitives)',
    ' * [What is Flow?](https://code.facebook.com/posts/1505962329687926/flow-a-new-static-type-checker-for-javascript/)',
    ' * [Danger\'s flow glossary](https://github.com/danger/danger-js/blob/master/docs/js_glossary.md)',
  ];
  markdown('--- \n\n If you are new to Flow, here are some resources: \n\n' + flowLinks.join('\n'));
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(', ')}`);
}

// Request a CHANGELOG entry, but allow a PR to say it doesn't neeed one
const hasChangelog = changedFiles.includes('changelog.md');
const declaredTrivial = danger.pr.title.indexOf('trivial') !== -1;

if (!hasChangelog && !declaredTrivial) {
  fail('Please add a changelog entry noting your changes.');
}

// Politely ask for their name on the entry too
if (hasChangelog) {
  const changelogDiff = danger.git.diffForFile('changelog.md');
  const contributorName = danger.github.pr.user.login;
  if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
    warn('Please add your GitHub name ("' + contributorName + '") to the changelog entry.');
  }
}
