import { Response } from 'express';
import { HTTP_STATUS } from '../constants';

export interface MetaData {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export class ApiResponse {
  public static success<T>(
    res: Response,
    message: string = 'Operation completed successfully',
    data?: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: MetaData
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      ...(data !== undefined && { data }),
      ...(meta && { meta }),
    });
  }

  public static created<T>(
    res: Response,
    message: string = 'Resource created successfully',
    data?: T
  ): Response {
    return this.success(res, message, data, HTTP_STATUS.CREATED);
  }

  public static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: any
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
    });
  }
}
