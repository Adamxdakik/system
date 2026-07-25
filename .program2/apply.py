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
    "server/routes.ts",
    'import { VoucherReversalService } from "./services/accounting/voucherReversalService";\nimport {\n',
    'import { VoucherReversalService } from "./services/accounting/voucherReversalService";\nimport { registerFinancialCorrectionRoutes } from "./financialCorrectionRoutes";\nimport {\n',
)

replace_once(
    "server/routes.ts",
    "export async function registerRoutes(app: Express): Promise<Server> {\n  // Database health check endpoint\n",
    "export async function registerRoutes(app: Express): Promise<Server> {\n  registerFinancialCorrectionRoutes(app);\n\n  // Database health check endpoint\n",
)
