import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    try {
        const data = await resend.emails.send({
            from: 'إتقان <onboarding@resend.dev>',
            to: 'test-user-random-123@example.com',
            subject: 'Test Email',
            html: '<p>Testing</p>'
        });
        console.log("Success:", data);
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
