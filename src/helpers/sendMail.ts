// const sgMail = require('@sendgrid/mail');
import * as sgMail from '@sendgrid/mail';

const sendMail = async (
  key: string,
  to: string,
  token: string,
): Promise<boolean | string> => {
  sgMail.setApiKey(key);
  const mail = {
    to,
    from: 'kiev_drum2006@ukr.net',
    subject: 'Email confirmation',
    html: `<a href="${process.env.BASE_URL}/api/users/verify/${token}" target="_blank">Press to confirm signup</a>`,
  };
  try {
    await sgMail.send(mail);
    return true;
  } catch (error: any) {
    return error.message;
  }
};

export default sendMail;
