import dotenv from 'dotenv';
dotenv.config();

const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_ACCESS_TOKEN;

// We will test querying the Meta messages endpoint format
async function testSend() {
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  console.log('Testing Meta Cloud API POST to:', url);

  // We test with a dummy recipient or validate payload schema
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '15556604049',
      type: 'text',
      text: { body: 'Test message from Kisan Setu' },
    }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

testSend();
