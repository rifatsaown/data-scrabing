import fs from 'fs';

const sendEmail = async (result:string |void) => {
    // Send email to the user
    console.log('Email sent');
    // fs.unlinkSync(result as string);
}

export default sendEmail;