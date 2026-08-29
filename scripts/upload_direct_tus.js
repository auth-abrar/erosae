const fs = require('fs');
const path = require('path');

async function upload() {
  const filePath = path.join(__dirname, '..', 'erosae_source.zip');
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  const fileData = fs.readFileSync(filePath);

  const baseUrl = 'https://srv2218-files.hstgr.io/rest/aca7b39851662e21/api/tus/public_html';
  const targetUrl = `${baseUrl}/erosae_source.zip?override=true`;

  const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJsb2NhbGUiOiJlbl9VUyIsInZpZXdNb2RlIjoibGlzdCIsInNpbmdsZUNsaWNrIjpmYWxzZSwicmVkaXJlY3RBZnRlckNvcHlNb3ZlIjpmYWxzZSwicGVybSI6eyJhZG1pbiI6ZmFsc2UsImV4ZWN1dGUiOmZhbHNlLCJjcmVhdGUiOnRydWUsInJlbmFtZSI6dHJ1ZSwibW9kaWZ5Ijp0cnVlLCJkZWxldGUiOnRydWUsInNoYXJlIjpmYWxzZSwiZG93bmxvYWQiOnRydWV9LCJjb21tYW5kcyI6W10sImxvY2tQYXNzd29yZCI6dHJ1ZSwiaGlkZURvdGZpbGVzIjpmYWxzZSwiZGF0ZUZvcm1hdCI6ZmFsc2UsInVzZXJuYW1lIjoidTI5NjQ1MzExNCIsImFjZUVkaXRvclRoZW1lIjoiIn0sImlzcyI6IkZpbGUgQnJvd3NlciIsImV4cCI6MTc4ODA1MjgwMCwiaWF0IjoxNzg4MDMxMjAwfQ.OV3_mjPkdI0fVacAjYscF3MdEaDZABrAIfGxpap3Z0A';
  const restAuthKey = '41c576deee99e2457243e13502cb31b5f6517f1148831de3faa30cf5ebe961f8-aca7b39851662e21';

  console.log(`Step 1: Sending POST to create upload for ${fileSize} bytes...`);
  const postRes = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'X-Auth': authKey,
      'X-Auth-Rest': restAuthKey,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': fileSize.toString(),
      'Upload-Offset': '0',
    },
  });

  console.log('POST response status:', postRes.status, postRes.statusText);

  console.log('Step 2: Sending PATCH with file content...');
  const patchRes = await fetch(targetUrl, {
    method: 'PATCH',
    headers: {
      'X-Auth': authKey,
      'X-Auth-Rest': restAuthKey,
      'Tus-Resumable': '1.0.0',
      'Content-Type': 'application/offset+octet-stream',
      'Upload-Offset': '0',
    },
    body: fileData,
  });

  console.log('PATCH response status:', patchRes.status, patchRes.statusText);
  if (patchRes.ok || patchRes.status === 204) {
    console.log('✅ erosae_source.zip uploaded successfully to Hostinger file storage!');
  } else {
    const text = await patchRes.text();
    console.error('PATCH failed:', text);
  }
}

upload().catch((err) => {
  console.error('Upload error:', err);
  process.exit(1);
});
