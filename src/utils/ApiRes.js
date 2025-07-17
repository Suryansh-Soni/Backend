class AiRes {
  constructor(statusCode, message, data) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.success = statusCode >= 200 && statusCode < 300;
  }

  static success(message, data = null) {
    return new AiRes(200, message, data);
  }

  static error(message, data = null) {
    return new AiRes(500, message, data);
  }

  static notFound(message, data = null) {
    return new AiRes(404, message, data);
  }
}
