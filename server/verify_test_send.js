// Phase 13E Verification: Real campaign test send through live API
require('dotenv').config();
const https = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXNieHU5OGwwMDAwc3p3ODFpZ3I5ZWZlIiwiZW1haWwiOiJhZG1pbi50ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzg2OTU3MjU3LCJleHAiOjE3ODY5NjA4NTd9.y4pu-EeJ1JKojkO9_zb0xf8VaG4x_enBGAiJ6EXbXL8';
const CAMPAIGN_ID = 'cmsiqgzv20004in6zugfhvnhe';
// Use a known address within Resend's accepted testing domain (no real inbox required)
// We'll target the user email that was the campaign owner
const TEST_EMAIL = 'john.doe@example.com';
const BASE = 'http://localhost:5000';

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n${method} ${path} -> HTTP ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch {
          console.log(data);
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('=== STEP 1: Verify Campaign Exists ===');
  const campResult = await makeRequest('GET', `/api/v1/campaigns/${CAMPAIGN_ID}`, null);

  console.log('\n=== STEP 2: Real Campaign Test Send ===');
  const testSendResult = await makeRequest(
    'POST',
    `/api/v1/campaigns/${CAMPAIGN_ID}/test-send`,
    { email: TEST_EMAIL }
  );

  if (testSendResult.statusCode === 200 || testSendResult.statusCode === 201) {
    console.log('\n✅ Test send accepted by API. Status:', testSendResult.statusCode);
    console.log('Returned status field:', testSendResult.body?.data?.status);
  } else {
    console.log('\n⚠️  Test send returned non-2xx:', testSendResult.statusCode);
  }
}

run().catch(console.error);
