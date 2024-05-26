const twilio = require('twilio'); // npm install twilio

module.exports = class Mobile {
  constructor(user) {
    this.to = user.mobile; // Assuming user object has phoneNumber property
    this.firstName = user.firstName;

    this.verificationCode = user.mobileVerificationCode;
    this.from = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number
  }

  newClient() {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async send(body) {
    const client = this.newClient();

    try {
      const message = await client.messages.create({
        body,
        from: this.from,
        to: this.to,
      });

      console.log(`Message sent: ${message.sid}`);
    } catch (error) {
      console.error(`Failed to send message: ${error.message}`);
    }
  }

  async sendWelcome() {
    const body = `Hello ${this.firstName}, welcome to Musa Platform! Your verification code is ${this.verificationCode}.`;
    await this.send(body);
  }
};
