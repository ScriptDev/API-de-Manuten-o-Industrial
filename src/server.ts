import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 API DE MANUTENÇÃO INDUSTRIAL INICIADA COM SUCESSO`);
  console.log(`📡 Endereço Local:      http://localhost:${PORT}`);
  console.log(`📚 Swagger OpenAPI UI:  http://localhost:${PORT}/api-docs`);
  console.log(`⚙️  Banco de Dados:     SQLite (Prisma ORM)`);
  console.log('====================================================');
});
