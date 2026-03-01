import nodemailer from 'nodemailer';

const smtpUrl = 'smtps://itz4kairo@gmail.com:pdxagjrhkuadpsqs@smtp.gmail.com';

const transporter = nodemailer.createTransport(smtpUrl);

const msg = {
    from: '"إتقان الفاتحة" <no-reply@itqaan.com>',
    to: 'itz4kairo@gmail.com', // Sending to yourself
    subject: 'Test Nodemailer - Itqaan',
    text: 'Testing if Nodemailer with Gmail App Password is working properly.',
    html: '<strong>Testing if Nodemailer with Gmail App Password is working properly.</strong>',
};

console.log('Sending test email via Nodemailer...');

transporter.sendMail(msg)
    .then((info) => {
        console.log('Test Email sent successfully!');
        console.log('Message ID:', info.messageId);
    })
    .catch((error) => {
        console.error('Error sending email:');
        console.error(error);
    });
