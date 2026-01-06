interface Env {
    TURNSTILE_SECRET_KEY: string;
}

export const onRequestPost = async (context) => {
    const { request, env } = context;

    try {
        const data = await request.formData();
        const token = data.get('cf-turnstile-response');
        const name = data.get('name');
        const email = data.get('email');
        const message = data.get('message');

        // 1. Validate Turnstile Token
        // In production, we would use env.TURNSTILE_SECRET_KEY
        // For demo/dev, we skip or use a test key validation endpoint
        // cloudflare challenges api: https://challenges.cloudflare.com/turnstile/v0/siteverify

        // Simulate validation
        const ip = request.headers.get('CF-Connecting-IP');
        const formData = new FormData();
        formData.append('secret', env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'); // Test key
        formData.append('response', token);
        formData.append('remoteip', ip);

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        if (!outcome.success) {
            return new Response(JSON.stringify({ error: 'Invalid captcha' }), { status: 400 });
        }

        // 2. Process Submission (Email/CRM)
        console.log(`New Lead: ${name} (${email}): ${message}`);

        // Return Redirect or JSON
        // Since we are using standard form submission in the UI example, we redirect.
        // Ideally we would use client-side JS to submit and handle JSON, but let's do a redirect for simplicity/robustness.
        return Response.redirect(new URL('/contact?success=true', request.url), 302);

    } catch (err) {
        return new Response('Error processing request', { status: 500 });
    }
};
