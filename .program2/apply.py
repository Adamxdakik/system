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
    "server/services/accounting/drizzleAccountingStore.ts",
    "type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];",
    "export type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];",
)

replace_once(
    "server/services/accounting/drizzleAccountingStore.ts",
    "export class DrizzleAccountingStore implements AccountingStore {\n  transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {\n    return db.transaction((tx) => work(new DrizzleAccountingTransaction(tx)));\n  }\n}\n",
    "export function accountingTransactionFor(tx: DrizzleTransaction): AccountingTransaction {\n  return new DrizzleAccountingTransaction(tx);\n}\n\nexport class DrizzleAccountingStore implements AccountingStore {\n  transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {\n    return db.transaction((tx) => work(accountingTransactionFor(tx)));\n  }\n}\n",
)
