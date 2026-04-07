// Función Serverless para Vercel — Mercado Pago Checkout
// El Access Token se lee de las variables de entorno de Vercel (seguro)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { items, successUrl, cancelUrl, customerEmail, customerName } = req.body;

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado en variables de entorno.' });
    }

    const mpItems = items.map(item => ({
      title: item.name,
      unit_price: parseFloat(item.price),
      quantity: parseInt(item.qty),
      currency_id: 'MXN'
    }));

    const preferenceData = {
      items: mpItems,
      payer: { name: customerName, email: customerEmail },
      back_urls: {
        success: successUrl,
        failure: cancelUrl,
        pending: successUrl
      },
      auto_return: 'approved',
      payment_methods: { installments: 12 },
      statement_descriptor: 'VELAS MEXICO',
      external_reference: 'PEDIDO_' + Date.now()
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const preference = await mpResponse.json();

    if (preference.init_point) {
      return res.status(200).json({ url: preference.init_point });
    } else {
      console.error('MP Error:', JSON.stringify(preference));
      return res.status(400).json({ error: 'Error al crear preferencia en Mercado Pago' });
    }

  } catch (error) {
    console.error('Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
