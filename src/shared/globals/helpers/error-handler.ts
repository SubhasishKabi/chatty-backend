// import { Server } from 'socket.io';
import HTTP_STATUS from 'http-status-codes';

export interface IErrorResponse {
  messsage: string;
  statusCode: number;
  status: string;
  serializeErrors(): IError;
}

export interface IError {
  message: string;
  statusCode: number;
  status: string;
}
//In TypeScript, an interface is a powerful construct that allows you to define the structure of an object.

export abstract class CustomError extends Error {
  abstract statusCode: number;
  abstract status: string;
  constructor(message: string) {
    super(message);
  }
  serializeErrors(): IError {
    return {
      message: this.message,
      statusCode: this.statusCode,
      status: this.status
    };
  }
}

//An abstract class serves as a blueprint or template for other classes to inherit from but cannot be used to create objects on its own.
//abstract classes cannot be directly instantiated

export class BadRequestError extends CustomError {
  statusCode = HTTP_STATUS.BAD_REQUEST;
  status = 'error';
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends CustomError {
  statusCode = HTTP_STATUS.NOT_FOUND;
  status = 'error';
  constructor(message: string) {
    super(message);
  }
}

export class NotAuthorizedError extends CustomError {
  statusCode = HTTP_STATUS.UNAUTHORIZED;
  status = 'error';
  constructor(message: string) {
    super(message);
  }
}

export class FileTooLargeError extends CustomError {
  statusCode = HTTP_STATUS.REQUEST_TOO_LONG;
  status = 'error';
  constructor(message: string) {
    super(message);
  }
}

export class ServerError extends CustomError {
  statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
  status = 'error';
  constructor(message: string) {
    super(message);
  }
}

export class JoinValidationError extends CustomError {
  statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
  status = 'error';
  constructor(message: string) {
    super(message);
  }
}
