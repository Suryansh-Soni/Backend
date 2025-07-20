class ApiRes {
  constructor(statusCode, message, data) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.success = statusCode >= 200 && statusCode < 300;
  }

  static success(message, data = null) {
    return new ApiRes(200, message, data);
  }

  static error(message, data = null) {
    return new ApiRes(500, message, data);
  }

  static notFound(message, data = null) {
    return new ApiRes(404, message, data);
  }
}

export { ApiRes };
