import fs from "fs";
import nodemailer from "nodemailer";


const validateEnvVariables = () => {
  const requiredEnvVariables = ["NODEMAIL_SERVICE", "NODEMAIL_EMAIL", "NODEMAIL_PASSWORD"];
  for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }
};


const createTransporter = () => {
  validateEnvVariables();
  const config = {
    service: process.env.NODEMAIL_SERVICE,
    auth: {
      user: process.env.NODEMAIL_EMAIL,
      pass: process.env.NODEMAIL_PASSWORD
    }
  };
  return nodemailer.createTransport(config);
};


const emailer = async (email:string, subject:string, htmlContent:string, filePath:string) => {
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }
  try {
    const transporterInstance = createTransporter();
    const mailOptions = {
      from: process.env.NODEMAIL_EMAIL || "",
      to: email,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: `${Date.now()}-Result_file.xlsx`,
          path: filePath
        }
      ]
    };
    console.log(filePath);
    const info = await transporterInstance.sendMail(mailOptions);
    return info;
  } catch (e) {
    console.error("Error sending email:", e);
    throw e;
  }
};

async function sendEmail(fileLink: string) {
  const email = "rifatsaown0@gmail.com";
  const subject = "Test Subject";
  const htmlContent = "<p>This is a test email.</p>";
  const filePath =  fileLink;

  try {
    const info = await emailer(email, subject, htmlContent, filePath);
    console.log("Email sent:", info.response);
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export default sendEmail;