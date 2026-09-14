#!/usr/bin/env node
// Generates relational-demo-standalone.html — a single-file version of the
// demo with relational-core.js inlined, so it works when someone downloads
// just the one file from GitHub and opens it.
//
// relational-core.js remains the single source of truth. The standalone is
// a build artifact: never edit it by hand, regenerate with `npm run build:demo`.

const fs = require('fs');
const path = require('path');

const dir = __dirname;

function build(demoFile, coreFiles, outFile) {
  let html = fs.readFileSync(path.join(dir, demoFile), 'utf8');

  for (const coreFile of coreFiles) {
    const core = fs.readFileSync(path.join(dir, coreFile), 'utf8');
    if (core.includes('</script>')) {
      console.error(coreFile + ' contains "</script>" — inlining would break the page.');
      process.exit(1);
    }
    const tag = '<script src="' + coreFile + '"></script>';
    if (!html.includes(tag)) {
      console.error(demoFile + ' no longer contains the expected script tag: ' + tag);
      process.exit(1);
    }
    // Replacer is a function so '$&' etc. inside the module source are
    // inserted literally — String.replace treats them as magic otherwise,
    // which corrupted the first build of the core standalone.
    html = html.replace(tag, () =>
      '<script>\n/* === inlined ' + coreFile + ' (generated) === */\n' + core + '\n</script>');
  }

  const banner = '<!--\n  GENERATED FILE — do not edit.\n' +
    '  Built from ' + demoFile + ' + ' + coreFiles.join(' + ') + ' by build-demo.js.\n' +
    '  Regenerate with: npm run build:demo\n-->\n';
  const outPath = path.join(dir, outFile);
  fs.writeFileSync(outPath, banner + html);
  console.log('wrote ' + outPath + ' (' + (fs.statSync(outPath).size / 1024).toFixed(0) + ' KB)');
}

build('relational-demo.html', ['relational-core.js', 'relational-memory.js', 'relational-calibration.js'], 'relational-demo-standalone.html');
build('cathedral-demo.html', ['cathedral-core.js', 'feedback-generator.js'], 'cathedral-demo-standalone.html');
build('cathedral-unified-2.html',
  ['cathedral-core.js', 'relational-core.js', 'relational-memory.js', 'relational-calibration.js',
   'sovereignty-detector.js', 'feedback-generator.js', 'verdict-memory.js', 'progression.js',
   'anchor-cases.js'],
  'cathedral-unified-2-standalone.html');
