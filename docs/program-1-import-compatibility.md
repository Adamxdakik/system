# Program 1 import compatibility inventory

Repository search found one Multer instance, five `upload.single("file")`
uses, no `upload.array` uses, one multipart CSV parser family, four multipart
XLSX parser routes, and four direct JSON batch-import routes. Template routes
are downloads and do not accept uploads.

## Multipart routes

| Route | Content type | Middleware/parser | Limit | Non-production fixture | Result |
| --- | --- | --- | ---: | --- | --- |
| `POST /api/companies/:id/moto-rates/import.csv` | `multipart/form-data`, field `file` | Multer memory storage, UTF-8 CSV parser | 10 MB | CSV headers `employee_code,location_code,rate,pct` | Route and parser retained; representative CSV structure verified |
| `POST /api/po-import/parse` | `multipart/form-data`, field `file` | Multer memory storage, ExcelJS-backed XLSX compatibility parser | 10 MB | In-memory workbook with item, barcode, quantity, rate, and charge columns | XLSX write/read/row conversion passes |
| `POST /api/pos-import/parse` | `multipart/form-data`, field `file` | Multer memory storage, ExcelJS-backed XLSX compatibility parser | 10 MB | In-memory `Barcode`, `Quantity`, `Rate` workbook | XLSX write/read/row conversion passes |
| `POST /api/stock-transfer-import/parse` | `multipart/form-data`, field `file` | Multer memory storage, ExcelJS-backed XLSX compatibility parser | 10 MB | In-memory `Barcode`, `Quantity` workbook | XLSX write/read/row conversion passes |
| `POST /api/stock-transfer-import/parse-multi-source` | `multipart/form-data`, field `file` | Multer memory storage, ExcelJS-backed XLSX compatibility parser | 10 MB | In-memory `Source Location`, `Barcode`, `Quantity` workbook | XLSX write/read/row conversion passes |

The Moto CSV route retains its existing missing-file response
`{"message":"Missing 'file' upload"}`. The four XLSX routes retain
`{"message":"No file uploaded"}`.

Focused middleware tests confirm that multipart parsing is not consumed by the
2 MB JSON or URL-encoded parsers, a file just above 2 MB and below 10 MB is
accepted, a file above 10 MB receives HTTP 413 with
`{"message":"Request payload too large","requestId":"..."}`, and a missing
file keeps the established validation shape.

## JSON batch routes

| Route | Content type | Parser | Limit | Compatibility result |
| --- | --- | --- | ---: | --- |
| `POST /api/locations/:locationId/import-cost-prices` | `application/json` | Express JSON plus existing route validation | 2 MB | Route name and response code paths unchanged |
| `POST /api/locations/:locationId/import-inventory` | `application/json` | Express JSON plus existing route validation | 2 MB | Route name and response code paths unchanged |
| `POST /api/stock-items/import-opening-balances` | `application/json` | Express JSON plus existing route validation | 2 MB | Route name and response code paths unchanged |
| `POST /api/stock-items/import` | `application/json` | Express JSON plus existing route validation | 2 MB | Route name and response code paths unchanged |

PO, POS, stock-transfer, and multi-source stock-transfer `validate` and
`import` endpoints also receive JSON produced by their parse screens and are
subject to the explicit 2 MB JSON limit. No import calculations, field
mapping, database writes, route names, or successful response shapes were
changed by Program 1.

Template downloads retained:

- `GET /api/po-import/template`
- `GET /api/pos-import/template`
- `GET /api/stock-transfer-import/template`
- `GET /api/stock-transfer-import/template-multi-source`
