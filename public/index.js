const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug.txt');

try {
  fs.writeFileSync(logFile, 'Log initialized at ' + new Date().toISOString() + '\n', 'utf8');
} catch (e) {
  // If we can't write, we can't write, but we should at least try
}

function log(msg) {
  try {
    fs.appendFileSync(logFile, msg + '\n', 'utf8');
  } catch (e) {}
}

// Override console.log and console.error to capture everything in debug.txt
console.log = function (...args) {
  log(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
};

console.error = function (...args) {
  log('[ERROR] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
};

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection: ${reason}`);
});

console.log('Attempting to require ../server.js');
try {
  require('../server.js');
  console.log('Successfully loaded ../server.js');
} catch (err) {
  console.error(`Require Error: ${err.message}`, err.stack);
  throw err;
}
