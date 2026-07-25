from pathlib import Path


path = Path("server/financialCorrectionRoutes.ts")
text = path.read_text()
marker = '  app.put(\n    "/api/vouchers/:id/sales",'
positions = []
start = 0
while True:
    index = text.find(marker, start)
    if index == -1:
        break
    positions.append(index)
    start = index + len(marker)

if len(positions) == 2:
    second_start = positions[1]
    next_route = text.find('  app.delete(\n    "/api/vouchers/:id",', second_start)
    if next_route == -1:
        raise RuntimeError("Could not find the route following duplicate POS correction")
    text = text[:second_start] + text[next_route:]
elif len(positions) != 1:
    raise RuntimeError(f"Expected one or two POS correction routes, found {len(positions)}")

path.write_text(text)
