import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import 'express-async-errors';
import { CustomError, IErrorResponse } from './shared/globals/helpers/error-handler';

import applicationRoutes from './route';

import { config } from './config';

import Logger from 'bunyan';
const log: Logger = config.createLogger('server');

const SERVER_PORT = 5000;
//Application is an instance of express application
export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleWare(this.app);
    this.standardMiddleWare(this.app);
    this.routeMiddleWare(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleWare(app: Application): void {
    app.use(
      cookieSession({
        //This sets the name of the session cookie to 'session'.
        name: 'session',
        //This specifies the array of keys used to sign (encrypt) the session cookie
        //! is used to assert that a value is not null or undefined
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        //This sets the maximum age of the session cookie in milliseconds
        maxAge: 24 * 7 * 360000,
        secure: config.NODE_ENV !== 'development'
      })
    );

    //prevents parameter pollution
    app.use(hpp());
    //Helmet is a security middleware that sets various HTTP headers to improve the security of the application by mitigating common web vulnerabilities.
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }
  private standardMiddleWare(app: Application): void {
    // The compression() middleware is used to enable gzip compression on responses sent from the server, reducing the size of the data sent over the network and improving the application's performance
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  private routeMiddleWare(app: Application): void {
    applicationRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnection(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`); //20576
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server is listening on port: ${SERVER_PORT}`);
    });
  }

  private socketIOConnection(io: Server): void {}
}
