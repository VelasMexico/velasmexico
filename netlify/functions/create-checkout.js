exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { items, successUrl, cancelUrl } = body;
        
        // Use environment variable, fallback to secret key if testing
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        
        if (!stripeSecretKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "No Stripe Secret Key found in environment variables." })
            };
        }

        // Build Stripe URL-encoded body
        const formBody = [];
        formBody.push(`success_url=${encodeURIComponent(successUrl)}`);
        formBody.push(`cancel_url=${encodeURIComponent(cancelUrl)}`);
        formBody.push(`mode=payment`);
        
        // Add items
        items.forEach((item, index) => {
            formBody.push(`line_items[${index}][price_data][currency]=mxn`);
            formBody.push(`line_items[${index}][price_data][product_data][name]=${encodeURIComponent(item.name)}`);
            // Stripe expects amount in cents (or base unit)
            formBody.push(`line_items[${index}][price_data][unit_amount]=${Math.round(item.price * 100)}`);
            formBody.push(`line_items[${index}][quantity]=${item.qty}`);
        });

        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody.join('&')
        });

        const session = await stripeResponse.json();

        if (session.error) {
            console.error("Stripe error:", session.error);
            return { statusCode: 400, body: JSON.stringify({ error: session.error.message }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error("Server error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
