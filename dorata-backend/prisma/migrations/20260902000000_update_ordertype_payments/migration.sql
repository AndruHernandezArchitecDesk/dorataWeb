-- Migrate PaymentMethod: TARJETA,BILLETERA_DIGITAL removed, TRANSFERENCIA added
UPDATE "Order" SET "paymentMethod" = NULL WHERE "paymentMethod" IN ('TARJETA','BILLETERA_DIGITAL');

CREATE TYPE "PaymentMethod_new" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";

-- Migrate OrderType: RECOGER -> PARA_LLEVAR, default COMER_AQUI
CREATE TYPE "OrderType_new" AS ENUM ('COMER_AQUI', 'PARA_LLEVAR', 'DOMICILIO');
ALTER TABLE "Order" ALTER COLUMN "orderType" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "orderType" TYPE "OrderType_new" USING (
  CASE WHEN "orderType"::text = 'RECOGER' THEN 'PARA_LLEVAR'::text ELSE "orderType"::text END::"OrderType_new"
);
ALTER TABLE "Order" ALTER COLUMN "orderType" SET DEFAULT 'COMER_AQUI';
DROP TYPE "OrderType";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
