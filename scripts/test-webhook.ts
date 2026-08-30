import dotenv from 'dotenv';
dotenv.config();

const renderUrl = 'https://kisan-setu-api.onrender.com/api/v1/whatsapp/webhook';

async function testInboundWebhook() {
  console.log(`\nTesting POST webhook to Render: ${renderUrl}`);
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1293140460550652',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15556604049',
                phone_number_id: '1293140460550652',
              },
              contacts: [
                {
                  profile: { name: 'Test Farmer' },
                  wa_id: '919876543210',
                },
              ],
              messages: [
                {
                  from: '919876543210',
                  id: `wamid_test_${Date.now()}`,
                  timestamp: `${Math.floor(Date.now() / 1000)}`,
                  text: { body: 'Hi' },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(renderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('Render webhook response status:', res.status);
    console.log('Render webhook response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error invoking Render webhook:', err);
  }
}

testInboundWebhook();
