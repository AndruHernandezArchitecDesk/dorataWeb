-- AlterEnum: add PREPARANDO to OrderStatus
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "OrderStatus_new" AS ENUM ('ABIERTO', 'ENVIADO_COCINA', 'PREPARANDO', 'PAGADO', 'LISTO', 'ENTREGADO');
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'ABIERTO';
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
