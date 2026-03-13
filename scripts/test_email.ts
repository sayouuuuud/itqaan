
import { sendEmail } from '../lib/email';

async function main() {
    console.log('Testing email sending...');
    const result = await sendEmail({
        to: 'itqaan69@gmail.com',
        subject: 'تجربة بريد إتقان - اختبار النجاح ✅',
        body: 'هذا بريد تجريبي للتأكد من عمل نظام الإرسال بعد تحديث كلمة المرور.',
        html: `
            <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #0B3D2E;">تم تحديث نظام البريد بنجاح! ✅</h2>
                <p>هذه رسالة اختبار لشركة إتقان.</p>
                <p>كلمة المرور الجديدة تعمل بشكل صحيح.</p>
            </div>
        `
    });

    if (result) {
        console.log('SUCCESS: Email sent successfully!');
    } else {
        console.error('FAILED: Email sending failed.');
    }
}

main();
