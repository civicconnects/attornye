export interface Env {
    TURNSTILE_SECRET_KEY: string;
    MAILGUN_API_KEY: string;
    MAILGUN_DOMAIN: string;
    // Add other secrets here
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const message = formData.get('message') as string;
        const token = formData.get('cf-turnstile-response') as string;

        // 1. Validate Inputs (Edge Side)
        if (!name || !email || !token) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Validate Turnstile Token
        const ip = request.headers.get('CF-Connecting-IP');
        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: new URLSearchParams({
                secret: env.TURNSTILE_SECRET_KEY, // Stored in Cloudflare Dashboard
                response: token,
                remoteip: ip || ''
            })
        });

        const turnstileOutcome = await turnstileResult.json() as any;
        if (!turnstileOutcome.success) {
            console.error('Turnstile verification failed:', turnstileOutcome);
            return new Response(JSON.stringify({ error: 'Spam check failed' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Send Email (e.g. Mailgun/SendGrid)
        // NOTE: This requires env variables to be set in Cloudflare Dashboard
        if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
            await sendEmail(env, { name, email, phone, message });
        } else {
            console.log('Mock Email Sent:', { name, email, message });
        }

        // 4. Return Success
        return new Response(JSON.stringify({ success: true, message: 'Message received' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Form Error:', err);
        // Silent fail to client, but logged
        return new Response(JSON.stringify({ error: 'Internal error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

async function sendEmail(env: Env, data: { name: string, email: string, phone: string, message: string }) {
    const body = new URLSearchParams({
        from: `AttorneyE Website <noreply@${env.MAILGUN_DOMAIN}>`,
        to: 'dwhitesvp@gmail.com', // Replace with attorney's email or env var
        subject: `New Legal Inquiry: ${data.name}`,
        text: `
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone}
      
      Message:
      ${data.message}
    `
    });

    return fetch(`https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + btoa('api:' + env.MAILGUN_API_KEY)
        },
        body
    });
}
