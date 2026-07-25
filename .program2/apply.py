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
    "scripts/test-financial-integrity-postgres.ts",
    """        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          source_type, source_id, idempotency_key
        ) VALUES ($1, $2, 'Journal', '2024-05-02', 1, 'REVERSAL_CONCURRENCY', $3, $3)
        RETURNING id
""",
    """        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          currency, exchange_rate, source_type, source_id, idempotency_key
        ) VALUES ($1, $2, 'Journal', '2024-05-02', 1, 'USD', 1,
          'REVERSAL_CONCURRENCY', $3, $3)
        RETURNING id
""",
)

replace_once(
    "scripts/test-financial-integrity-postgres.ts",
    """        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          source_type, source_id, idempotency_key, reversal_of_voucher_id
        ) VALUES ($1, $2, 'Journal', '2024-05-03', 1, 'VOUCHER_REVERSAL', $3, $3, $4)
""",
    """        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          currency, exchange_rate, source_type, source_id, idempotency_key,
          reversal_of_voucher_id
        ) VALUES ($1, $2, 'Journal', '2024-05-03', 1, 'USD', 1,
          'VOUCHER_REVERSAL', $3, $3, $4)
""",
)
