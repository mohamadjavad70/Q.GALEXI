process.stdout.write('STEP1: starting\n');
const path = require('path');
process.stdout.write('STEP2: path loaded\n');
try {
  const expressPath = path.join('C:', 'Users', 'KUNIGO', 'Downloads', 'Q.GALEXI', 'node_modules', 'express');
  process.stdout.write('STEP3: trying to load: ' + expressPath + '\n');
  const express = require(expressPath);
  process.stdout.write('STEP4: express loaded, type=' + typeof express + '\n');
  const app = express();
  process.stdout.write('STEP5: app created\n');
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  const server = app.listen(3001, () => {
    process.stdout.write('STEP6: LISTENING on 3001\n');
  });
  server.on('error', (err) => {
    process.stderr.write('SERVER_ERROR: ' + err.message + '\n');
    process.exit(1);
  });
} catch (e) {
  process.stderr.write('CATCH_ERR: ' + e.message + '\n');
  process.stderr.write('STACK: ' + e.stack + '\n');
  process.exit(1);
}
