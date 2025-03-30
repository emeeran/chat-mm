// Polyfill for util._extend deprecation
// This directly patches the Node.js util module

// Handle process.emitWarning to suppress deprecation warnings
if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
  // Store the original emitWarning function
  const originalEmitWarning = process.emitWarning;
  
  // Override emitWarning to filter out util._extend warnings
  process.emitWarning = function(warning, ...args) {
    // If it's the util._extend warning, suppress it
    if (warning && typeof warning === 'string' && 
        (warning.includes('util._extend') || warning.includes('The `util._extend`'))) {
      // Suppress this specific warning
      return;
    }
    
    // Pass through all other warnings
    return originalEmitWarning.call(this, warning, ...args);
  };
}

// Only run this in a Node.js environment (during build/dev)
if (typeof process !== 'undefined' && typeof require === 'function') {
  try {
    // Try to get the util module
    const util = require('util');
    
    // If it exists and has _extend, replace it with Object.assign
    if (util && typeof util._extend === 'function') {
      // Save the original for compatibility
      util._extend_original = util._extend;
      
      // Replace with Object.assign
      util._extend = function(target, source) {
        // Silently use Object.assign without logging
        return Object.assign(target, source);
      };
    }
  } catch (e) {
    // Safely ignore - we might be in a browser environment
    console.log('Could not patch util._extend:', e.message);
  }
} 