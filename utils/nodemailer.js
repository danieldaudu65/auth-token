const nodemailer = require("nodemailer");
require("dotenv").config();


const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false
  }
});


const sendOTP = async (email, otp) => {
  try {
    const info = await transport.sendMail({
      
      from: `Backend Team <${process.env.MAIL_USER}>`,
      to: email,
      subject: "One Time Password",
      html: `<p style="line-height: 1.5">
        Your OTP verification code is: <br /> <br />
        <font size="3px">${otp}</font> <br />
        Please note that this otp will be valid for 5 minutes
        Best regards,<br />
        The Backend Team.
        </p>
        </div>`,
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};

module.exports = sendOTP