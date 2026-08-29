const fs = require('fs');
const path = require('path');
const axios = require('axios');
const tus = require('tus-js-client');

const API_TOKEN = process.env.HOSTINGER_API_TOKEN;
const DOMAIN = process.env.HOSTINGER_DOMAIN || 'erosae.com';
const USERNAME = process.env.HOSTINGER_USERNAME || 'u296453114';
const BASE_URL = 'https://developers.hostinger.com';
const ARCHIVE_FILE = path.join(__dirname, '..', 'erosae_deploy.zip');

if (!API_TOKEN) {
  console.error('Error: HOSTINGER_API_TOKEN environment variable is required.');
  process.exit(1);
}

async function main() {
  console.log(`Starting automated production deployment for ${DOMAIN} (User: ${USERNAME})...`);

  // 1. Get TUS upload credentials
  console.log('Step 1: Requesting upload credentials from Hostinger API...');
  const uploadCredsRes = await axios.post(
    `${BASE_URL}/api/hosting/v1/files/upload-urls`,
    { username: USERNAME, domain: DOMAIN },
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  const creds = uploadCredsRes.data;
  console.log('Upload credentials received.');

  // 2. Pre-upload POST & TUS upload
  const stats = fs.statSync(ARCHIVE_FILE);
  const archiveBasename = path.basename(ARCHIVE_FILE);
  const cleanUploadUrl = creds.url.replace(/\/$/, '');
  const uploadUrlWithFile = `${cleanUploadUrl}/${archiveBasename}?override=true`;

  console.log(`Step 2a: Initializing pre-upload POST to ${uploadUrlWithFile}...`);
  const requestHeaders = {
    'X-Auth': creds.auth_key,
    'X-Auth-Rest': creds.rest_auth_key,
    'upload-length': stats.size.toString(),
    'upload-offset': '0',
  };

  await axios.post(uploadUrlWithFile, '', {
    headers: requestHeaders,
    timeout: 60000,
    validateStatus: (s) => s === 201 || s === 200,
  });

  console.log(`Step 2b: Streaming TUS upload (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
  const fileStream = fs.createReadStream(ARCHIVE_FILE);

  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(fileStream, {
      uploadUrl: uploadUrlWithFile,
      retryDelays: [1000, 2000, 4000, 8000, 16000, 20000],
      uploadDataDuringCreation: false,
      parallelUploads: 1,
      chunkSize: 10485760,
      headers: requestHeaders,
      removeFingerprintOnSuccess: true,
      uploadSize: stats.size,
      metadata: {
        filename: archiveBasename,
      },
      onError: (error) => {
        console.error('TUS upload error:', error.message);
        reject(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`Uploaded ${bytesUploaded} of ${bytesTotal} bytes (${percentage}%)`);
      },
      onSuccess: () => {
        console.log('TUS Upload successfully finished!');
        resolve();
      },
    });

    upload.start();
  });

  // 3. Trigger Hostinger Server Extraction / Deployment
  console.log('Step 3: Triggering server-side extraction and deployment...');
  const deployUrl = `${BASE_URL}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/deploy`;
  const deployRes = await axios.post(
    deployUrl,
    { archive_path: archiveBasename },
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('Deployment trigger response:', JSON.stringify(deployRes.data, null, 2));
  console.log('SUCCESS! DEPLOYED TO HOSTINGER LIVE SERVER!');
}

main().catch((err) => {
  console.error('Deployment error:', err.response?.data || err.message);
  process.exit(1);
});
