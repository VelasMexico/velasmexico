const https = require('https');

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { items, successUrl, cancelUrl, customerEmail, customerName } = body;
    
    // Access Token de Producción
    const accessToken = "APP_USR-2399881261670527-040618-bd19dc81af56c6a8ffeb0a3f9f9396d8-3158076909";

    const mpItems = items.map(item => ({
      title: item.name,
      unit_price: parseFloat(item.price),
      quantity: parseInt(item.qty),
      currency_id: 'MXN'
    }));

    const preferenceData = JSON.stringify({
      items: mpItems,
      payer: { name: customerName, email: customerEmail },
      back_urls: { success: successUrl, failure: cancelUrl, pending: successUrl },
      auto_return: "approved",
      payment_methods: { installments: 12 },
      statement_descriptor: "VELAS MEXICO",
      external_reference: "PEDIDO_" + Date.now()
    });

    const options = {
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': preferenceData.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const preference = JSON.parse(data);
          if (preference.init_point) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ url: preference.init_point })
            });
          } else {
            console.error("MP Error:", preference);
            resolve({ statusCode: 400, body: JSON.stringify({ error: "Error en Mercado Pago" }) });
          }
        });
      });

      req.on('error', (e) => {
        console.error("Request Error:", e);
        resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
      });

      req.write(preferenceData);
      req.end();
    });

  } catch (error) {
    console.error("Handler Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
