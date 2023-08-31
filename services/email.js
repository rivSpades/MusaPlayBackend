const nodemailer = require('nodemailer'); //npm install nodemailer
const htmlToText = require('html-to-text'); //npm install html-to-text

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // Creates the transport object
    return nodemailer.createTransport({
      // Use your email service provider's SMTP settings here
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // Set to true if using SSL
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, htmlContent) {
    // Accepts the subject of the email and the HTML content

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: htmlContent,
      //text: htmlToText.fromString(htmlContent), // Convert the HTML into plain text to avoid spam filters
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    // Create a customized method for welcome emails
    const subject = 'Welcome to the Musa Platform!';
    const htmlContent =
      '<p>Hello ' + this.firstName + ', welcome to Musa Platform</p>'; // Your HTML content here
    await this.send(subject, htmlContent);
  }

  async sendPasswordReset() {
    // Send emails related to password resets
    const subject = 'Your password reset token (valid for only 10 minutes)';
    const htmlContent = `<p>Hello ${this.firstName}, here is your password reset token.</p> <p>${this.url}</p>`; // Your HTML content here
    await this.send(subject, htmlContent);
  }
};
