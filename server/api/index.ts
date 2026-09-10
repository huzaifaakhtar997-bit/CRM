import app from "../src/app";

// Export the Express app for Vercel's serverless runtime.
// Vercel compiles this file using its own bundler which correctly
// handles ESM/CJS interop — do NOT pre-compile this with tsc.
export default app;
