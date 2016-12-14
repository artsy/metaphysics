// @flow

import { danger, fail, warn, markdown } from 'danger';
const fs = require('fs');

// Move all JS files towards using flow
const changes = danger.git.created_files.concat(danger.git.modified_files);
const unFlowedFiles = changes.filter(path => !path.startWith('test/') && path.endWith('js'))
  .filter(filepath => {
    const content = fs.readFileSync(filepath);
    return !content.includes('@flow');
  });

if (unFlowedFiles.length > 0) {
  const flowLinks = [
    ' * [Main Site](https://flowtype.org)',
    ' * [Types](https://flowtype.org/docs/quick-reference.html#primitives)',
    ' * [What is Flow?](https://code.facebook.com/posts/1505962329687926/flow-a-new-static-type-checker-for-javascript/)',
    ' * [Danger\'s flow glossary](https://github.com/danger/danger-js/blob/master/docs/js_glossary.md)',
  ];
  markdown('If you are new to Flow, here are some resources: \n\n' + flowLinks.join('\n'));
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(', ')}`);
}

// Request a CHANGELOG entry
const hasChangelog = danger.git.modified_files.includes('changelog.md');
if (!hasChangelog) { fail('Please add a changelog entry for your changes.'); }

// Politely ask for their name on the entry too
const changelogDiff = danger.git.diffForFile('changelog.md');
const contributorName = danger.github.pr.user.login;
if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
  warn('Please add your GitHub name to "' + contributorName + '" the changelog entry.');
}
