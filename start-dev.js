#!/usr/bin/env node

/**
 * Development script to start both frontend and backend servers
 * Run with: node start-dev.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting development servers...\n');

// Start backend server
console.log('📦 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: join(__dirname, 'server'),
  shell: true,
  stdio: 'inherit'
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('\n🎨 Starting frontend server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit'
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit();
  });
}, 2000);

