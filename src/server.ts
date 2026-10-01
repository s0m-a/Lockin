import app from './app';
import { env } from './config/env';
import { checkDatabaseConnection, prisma } from './config/prisma';

async function start() {
  // Verify the RDS connection before accepting traffic
  await checkDatabaseConnection();

  const server = app.listen(env.PORT, () => {
    console.log(`Lock In Auth API`);
    console.log(`    ├─ Mode: ${env.NODE_ENV}`);
    console.log(`    ├─ Port: ${env.PORT}`);
    console.log(`    └─ URL:  http://localhost:${env.PORT}\n`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Prisma disconnected. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
