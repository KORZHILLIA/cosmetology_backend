import { ConfigService } from '@nestjs/config';
const sgMail = require('@sendgrid/mail');

const configService = new ConfigService();
sgMail.setApiKey('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');

const sendMail = async (to: string, token: string): Promise<boolean> => {
    const mail = {
        to,
        from: 'kiev_drum2006@ukr.net',
        subject: 'Email confirmation',
        html: `<a href="${process.env.BASE_URL}/users/verify/${token}" target="_blank">Press to confirm signup</a>`
    };
    try {
        await sgMail.send(mail);
        return true;
    } catch (error: any) {
        throw error.message;
    }
};

export default sendMail;