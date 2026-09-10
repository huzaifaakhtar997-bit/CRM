const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    console.log('Logging in to get token...');
    const loginResp = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'testadmin@crm.local',
      password: 'Admin1234'
    });
    const token = loginResp.data.data.token;
    console.log('Token acquired. Uploading CSV...');

    const form = new FormData();
    form.append('file', fs.createReadStream('demo_contacts.csv'));

    const uploadResp = await axios.post('http://localhost:5000/api/v1/imports/contacts', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Bearer ' + token
      }
    });

    console.log('UPLOAD STATUS:', uploadResp.status);
    console.log('UPLOAD RESPONSE:', JSON.stringify(uploadResp.data, null, 2));

    console.log('\nChecking imported contacts...');
    const contactsResp = await axios.get('http://localhost:5000/api/v1/contacts?search=demo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('CONTACTS FOUND:', contactsResp.data.data.contacts.length);
    console.log(JSON.stringify(contactsResp.data.data.contacts, null, 2));

  } catch (error) {
    console.error('ERROR:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

testUpload();
