import nodemailer from 'nodemailer';

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.example.com', // Replace with your SMTP server
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'your-email@example.com', // Replace with your email
                pass: 'your-email-password', // Replace with your email password
            },
        });
    }

    async sendNotification(email: string, subject: string, message: string): Promise<void> {
        const mailOptions = {
            from: '"Employee System" <your-email@example.com>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: message, // plain text body
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Notification sent successfully');
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}

export default new EmailService();