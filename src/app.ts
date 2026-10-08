import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerDocument } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// [DevSecOps] Middlewares globais de segurança e parsing
app.use(cors());
app.use(express.json());

// [Swagger] Documentação interativa em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'API Manutenção Industrial - Swagger',
}));

// [Rotas] Agregador modular
app.use(routes);

// [DevSecOps] Middleware global de captura e saneamento de exceções
app.use(errorHandler);

export default app;
