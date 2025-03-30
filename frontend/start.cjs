#!/usr/bin/env node

// Set environment variables to suppress deprecation warnings
process.env.NODE_OPTIONS = '--no-deprecation';

// Run the dev server
require('child_process').spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Additional env settings for Sass
    SASS_SILENCE_DEPRECATION_WARNINGS: 'true',
    SASS_PATH: './src/styles',
    VITE_HIDE_WARNINGS: 'true'
  }
}); 