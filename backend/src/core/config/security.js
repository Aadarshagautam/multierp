import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'

export const securityMiddleware = (app) => {
  // Helmet - Sets security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }))

  // Prevent NoSQL injection
  app.use(mongoSanitize())

  // Prevent HTTP Parameter Pollution
  app.use(hpp())

  // Hide Express from headers
  app.disable('x-powered-by')
}
