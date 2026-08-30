import dotenv from 'dotenv';
dotenv.config();

const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_ACCESS_TOKEN;

console.log('--- Testing WhatsApp Cloud API Credentials ---');
console.log('Phone Number ID:', phoneId);
console.log('Access Token Length:', token ? token.length : 0);

async function testMetaConnection() {
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}`;
    console.log(`Checking Phone Number metadata at: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log('Meta API Response status:', res.status);
    console.log('Meta API Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error contacting Meta Graph API:', err);
  }
}

testMetaConnection();
