import nodemailer from 'nodemailer';

const smtpUrl = 'smtps://itz4kairo@gmail.com:pdxagjrhkuadpsqs@smtp.gmail.com';

const transporter = nodemailer.createTransport(smtpUrl);

const msg = {
    from: '"إتقان الفاتحة" <itz4kairo@gmail.com>', // MUST exactly match the authenticated account for Gmail to prevent classification issues
    to: 'test-recipient@example.com', // User can change this to test
    subject: 'Test External Nodemailer - Itqaan',
    text: 'Testing if Nodemailer with Gmail App Password works for external addresses.',
    html: '<strong>Testing if Nodemailer works for external addresses.</strong>',
};

console.log('Sending test email via Nodemailer to external address...');

transporter.sendMail(msg)
    .then((info) => {
        console.log('Test Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Accepted by:', info.accepted);
        console.log('Rejected by:', info.rejected);
    })
    .catch((error) => {
        console.error('Error sending email:');
        console.error(error);
    });
