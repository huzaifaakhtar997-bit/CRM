import app from "../src/app";

// Disable Vercel's default body parser so Express can handle it natively.
// This is critical for the Resend Svix webhook which relies on express.raw() 
// to verify the exact bytes of the cryptographic signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

// In a serverless environment, we don't call app.listen().
// We simply export the Express application instance, and Vercel routes incoming 
// requests to it automatically.
export default app;
