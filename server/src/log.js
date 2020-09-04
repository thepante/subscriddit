import fs from 'fs';
import path from 'path';
import config from './config.js';

// This file handles the debugging. Should import this in main file app.js
// Makes console.log to print to stdout but also to write it in 'debug.log' file

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const logfile = path.join(__dirname, 'debug.log');

let logFile = fs.createWriteStream(logfile, {flags : 'a'});
let logStdout = process.stdout;

const options = {
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
};

const time = () => new Date().toLocaleTimeString([], options);

let firstLogMessage = true;

console.log = function() {
  let args = Array.prototype.slice.call(arguments);
  let message = ' ' + args.join(' ');

  if (firstLogMessage) {
    message = message.substr(1);
    firstLogMessage = false;
  }

  let line = `${time()} -${message}\n`;

  if (config.get('logs.enabled')) logStdout.write(line);
  if (config.get('logs.save')) logFile.write(line);
};

// Log server start
console.log(`╦════════════════╗
          ║ Server started ║ ${new Date().toDateString()}
          ╚════════════════╝`);

export default console.log;
