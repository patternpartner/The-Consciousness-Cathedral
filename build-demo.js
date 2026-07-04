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
const html = fs.readFileSync(path.join(dir, 'relational-demo.html'), 'utf8');
const core = fs.readFileSync(path.join(dir, 'relational-core.js'), 'utf8');

if (core.includes('</script>')) {
  console.error('relational-core.js contains "</script>" — inlining would break the page.');
  process.exit(1);
}

const tag = '<script src="relational-core.js"></script>';
if (!html.includes(tag)) {
  console.error('relational-demo.html no longer contains the expected script tag: ' + tag);
  process.exit(1);
}

const banner = '<!--\n  GENERATED FILE — do not edit.\n' +
  '  Built from relational-demo.html + relational-core.js by build-demo.js.\n' +
  '  Regenerate with: npm run build:demo\n-->\n';

const out = banner + html.replace(tag,
  '<script>\n/* === inlined relational-core.js (generated) === */\n' + core + '\n</script>');

const outPath = path.join(dir, 'relational-demo-standalone.html');
fs.writeFileSync(outPath, out);
console.log('wrote ' + outPath + ' (' + (fs.statSync(outPath).size / 1024).toFixed(0) + ' KB)');
