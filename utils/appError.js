class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}.startsWith('4') ? 'fail' : 'error'`; //if the error it's on the 400 family the status is 'fail' else is 'error'
    this.isOperational = true;

    Error.captureStackTrace(this, this.contructor); //this shows where the error was caused (file and line)
  }
}

module.exports = AppError;
