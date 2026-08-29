const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadUrl = process.env.HOSTINGER_TUS_ENDPOINT;
const authKey = process.env.HOSTINGER_TUS_AUTH_KEY;
const restAuthKey = process.env.HOSTINGER_TUS_REST_AUTH_KEY;

if (!uploadUrl || !authKey || !restAuthKey) {
  console.error('Error: HOSTINGER_TUS_ENDPOINT, HOSTINGER_TUS_AUTH_KEY, and HOSTINGER_TUS_REST_AUTH_KEY environment variables are required.');
  process.exit(1);
}

const filePath = path.join(__dirname, '..', 'erosae_source.zip');
const fileName = 'erosae_source.zip';

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at ${filePath}`);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);
const fileSize = fileBuffer.length;

console.log(`Starting TUS Upload for ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

const targetUrl = new URL(`${uploadUrl}/${fileName}?override=true`);

async function upload() {
  const postOptions = {
    method: 'POST',
    headers: {
      'X-Auth': authKey,
      'X-Auth-Rest': restAuthKey,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': fileSize.toString(),
      'Upload-Offset': '0',
    },
  };

  const postReq = https.request(targetUrl, postOptions, (res) => {
    console.log(`POST Response Status: ${res.statusCode} ${res.statusMessage}`);

    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('Initiation successful. Starting binary PATCH...');

      const patchOptions = {
        method: 'PATCH',
        headers: {
          'X-Auth': authKey,
          'X-Auth-Rest': restAuthKey,
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'Content-Length': fileSize.toString(),
        },
      };

      const patchReq = https.request(targetUrl, patchOptions, (patchRes) => {
        console.log(`PATCH Response Status: ${patchRes.statusCode} ${patchRes.statusMessage}`);
        if (patchRes.statusCode === 204 || patchRes.statusCode === 200) {
          console.log(`Upload complete! ${fileName} has been deployed.`);
        }
      });

      patchReq.on('error', (e) => console.error('PATCH error:', e));
      patchReq.write(fileBuffer);
      patchReq.end();
    } else {
      res.on('data', (d) => process.stdout.write(d));
    }
  });

  postReq.on('error', (e) => console.error('POST error:', e));
  postReq.end();
}

upload();
