from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count == 0:
        if new in text:
            return
        raise RuntimeError(f"Expected patch target was not found in {path}")
    if count != 1:
        raise RuntimeError(f"Expected one patch target in {path}, found {count}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "server/services/accounting/posSaleCorrectionService.ts",
    'import { inventory, salesItems, stockItems } from "@shared/schema";',
    'import { inventory, salesItems, stockItems, vouchers } from "@shared/schema";',
)

replace_once(
    "server/services/accounting/posSaleCorrectionService.ts",
    """      const locationId = await tx
        .select({ locationId: inventory.locationId })
        .from(inventory)
        .where(eq(inventory.id, -1))
        .then(() => undefined as number | undefined);
      void locationId;

      const [voucherRow] = await tx.execute<{
        location_id: number | null;
        description: string | null;
      }>(
        `SELECT location_id, description FROM vouchers WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [input.voucherId, input.companyId],
      );
      const saleLocationId = Number(voucherRow?.location_id);
""",
    """      const [voucherRow] = await tx
        .select({ locationId: vouchers.locationId, description: vouchers.description })
        .from(vouchers)
        .where(and(eq(vouchers.id, input.voucherId), eq(vouchers.companyId, input.companyId)))
        .for("update")
        .limit(1);
      const saleLocationId = Number(voucherRow?.locationId);
""",
)

replace_once(
    "server/services/accounting/posSaleCorrectionService.ts",
    """      const placeholderTotal = input.items.reduce((sum, item) => {
        const quantity = decimalToScaledInteger(item.quantity, 3);
        const price = decimalToScaledInteger(item.sellingPrice ?? item.rate ?? "0", 2);
        return sum + lineAmount(quantity, price);
      }, 0n);
""",
    """      const products = await tx
        .select({ id: stockItems.id, sellingPrice: stockItems.sellingPrice })
        .from(stockItems)
        .where(inArray(stockItems.id, [...new Set(input.items.map((item) => item.stockItemId))]));
      const configuredPrices = new Map(products.map((product) => [product.id, product.sellingPrice]));
      const placeholderTotal = input.items.reduce((sum, item) => {
        const quantity = decimalToScaledInteger(item.quantity, 3);
        const configured = configuredPrices.get(item.stockItemId);
        const configuredPrice = configured ? decimalToScaledInteger(configured, 2) : 0n;
        const submittedPrice = decimalToScaledInteger(item.sellingPrice ?? item.rate ?? "0", 2);
        return sum + lineAmount(quantity, configuredPrice > 0n ? configuredPrice : submittedPrice);
      }, 0n);
""",
)

replace_once(
    "server/services/accounting/posSaleCorrectionService.ts",
    """        description: input.description ?? voucherRow?.description ?? null,
""",
    """        description: input.description ?? voucherRow?.description ?? null,
""",
)

replace_once(
    "server/services/accounting/posSaleCorrectionService.ts",
    """      const result = await tx.execute<{ location_id: number | null }>(
        `SELECT location_id FROM vouchers WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [input.voucherId, input.companyId],
      );
      const saleLocationId = Number(result[0]?.location_id);
""",
    """      const [voucherRow] = await tx
        .select({ locationId: vouchers.locationId })
        .from(vouchers)
        .where(and(eq(vouchers.id, input.voucherId), eq(vouchers.companyId, input.companyId)))
        .for("update")
        .limit(1);
      const saleLocationId = Number(voucherRow?.locationId);
""",
)
