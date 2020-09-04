// import config from './settings.js';
import config from './config.js';

// Better console logs and (if enabled) writes to debug.log file
import './log.js';

// Start WebSocket server
import './server-ws.js';

// Start HTTP server
if (config.get('server.http.enabled')) {
  import('./server-http.js');
} else {
  console.log("HTTP Server is disabled");
}

// Start the scanner
import { scanConstantly } from './scanner.js';
scanConstantly();
