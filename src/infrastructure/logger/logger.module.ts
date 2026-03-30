import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') !== 'production';

        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info',
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                params: req.params,
                headers: {
                  host: req.headers.host,
                  'user-agent': req.headers['user-agent'],
                  'content-type': req.headers['content-type'],
                },
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
              err: (err) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            customProps: (req) => ({
              correlationId: req.id,
            }),
            genReqId: (req, res) => {
              // Use existing correlation ID if present, otherwise generate new one
              const existingId =
                req.headers['x-correlation-id'] || req.id || uuidv4();
              req.id = existingId;
              const headerId =
                typeof existingId === 'string'
                  ? existingId
                  : String(existingId);
              res.setHeader('x-correlation-id', headerId);
              return headerId;
            },
            customLogLevel: (req, res, err) => {
              if (res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn';
              } else if (res.statusCode >= 500 || err) {
                return 'error';
              }
              return 'info';
            },
            customSuccessMessage: (req, res) => {
              return `${req.method} ${req.url} ${res.statusCode}`;
            },
            customErrorMessage: (req, res, err) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
