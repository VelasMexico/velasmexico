const https = require('https');

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { token, issuer_id, payment_method_id, installments, payer, amount } = body;
    
    // Access Token de Producción
    const accessToken = "APP_USR-2399881261670527-040618-bd19dc81af56c6a8ffeb0a3f9f9396d8-3158076909";

    const paymentData = JSON.stringify({
      token,
      issuer_id,
      payment_method_id,
      transaction_amount: parseFloat(amount),
      installments: parseInt(installments),
      payer: {
        email: payer.email,
        identification: payer.identification
      },
      description: "Velas México - Pedido Directo",
      statement_descriptor: "VELAS MEXICO",
      external_reference: "PED_BRICK_" + Date.now()
    });

    const options = {
      hostname: 'api.mercadopago.com',
      path: '/v1/payments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': paymentData.length,
        'X-Idempotency-Key': 'key_' + Date.now()
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.status === 'approved' || response.status === 'in_process') {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ status: response.status, detail: response.status_detail })
            });
          } else {
            console.error("Payment Failure:", response);
            resolve({ 
              statusCode: 400, 
              body: JSON.stringify({ error: response.message || "Pago rechazado", detail: response.status_detail }) 
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error("Request Error:", e);
        resolve({ statusCode: 500, body: JSON.stringify({ error: "Server Error" }) });
      });

      req.write(paymentData);
      req.end();
    });

  } catch (error) {
    console.error("Handler Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Gateway Error" }) };
  }
};
