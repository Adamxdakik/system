from pathlib import Path

path = Path("server/routes.ts")
text = path.read_text()
replacements = {
    "currency: schema.companies.currency,": 'currency: sql<string | null>`NULL`,',
    "fiscalYearStart: schema.companies.fiscalYearStart,": 'fiscalYearStart: sql<string | null>`NULL`,',
    "address: schema.companies.address,": 'address: sql<string | null>`NULL`,',
    "phone: schema.companies.phone,": 'phone: sql<string | null>`NULL`,',
    "email: schema.companies.email,": 'email: sql<string | null>`NULL`,',
    "taxNumber: schema.companies.taxNumber,": 'taxNumber: sql<string | null>`NULL`,',
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match, found {count}: {old}")
    text = text.replace(old, new, 1)
path.write_text(text)
