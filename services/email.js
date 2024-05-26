const nodemailer = require('nodemailer'); //npm install nodemailer

const sgMail = require('@sendgrid/mail');
module.exports = class Email {
  constructor(user, url = '') {
    this.to = user.email;
    console.log(user);
    this.firstName = user.firstName;
    this.url = url;
    this.verificationCode = user.emailVerificationCode;
    this.from = `${process.env.EMAIL_FROM}`;
  }

  async sendGrid() {
    const htmlContent =
      '<p>Hello ' +
      this.firstName +
      `, welcome to Musa Platform</p><p>Please confirm your e-mail by entering this code:</p> <p>${this.verificationCode}</p>`; // Your HTML content here

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: this.to, // Use the instance variable
      from: this.from, // Use the instance variable
      subject: 'Musa Welcome',
      text: 'and easy to do anywhere, even with Node.js',
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent');
    } catch (error) {
      console.error(error);
    }
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
      '<p>Hello ' +
      this.firstName +
      `, welcome to Musa Platform</p><p>Please confirm your e-mail by putting this code</P> <p>${this.verificationCode}</p>`; // Your HTML content here

    await this.send(subject, htmlContent);
  }

  async sendPasswordReset() {
    // Send emails related to password resets
    const subject = 'Your password reset token (valid for only 10 minutes)';
    const htmlContent = `<p>Hello ${this.firstName}, here is your password reset token.</p> <p>${this.url}</p>`; // Your HTML content here
    await this.send(subject, htmlContent);
  }
};
