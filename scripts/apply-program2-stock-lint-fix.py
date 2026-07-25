from pathlib import Path

path = Path("client/src/pages/StockTransferOrder.tsx")
source = path.read_text()

old_import = 'import { useState, useEffect, Fragment, useRef, useCallback } from "react";'
new_import = (
    'import { useState, useEffect, Fragment, useRef, useCallback, useMemo } from "react";'
)
if new_import not in source:
    if old_import not in source:
        raise SystemExit("React hook import anchor not found")
    source = source.replace(old_import, new_import, 1)

old_flat_items = '''  const flatItems =
    summaryData?.stockGroups.flatMap((group) =>
      expandedGroups.has(group.id)
        ? [...group.items].sort((a, b) => a.name.localeCompare(b.name))
        : [],
    ) || [];'''
new_flat_items = '''  const flatItems = useMemo(
    () =>
      summaryData?.stockGroups.flatMap((group) =>
        expandedGroups.has(group.id)
          ? [...group.items].sort((a, b) => a.name.localeCompare(b.name))
          : [],
      ) || [],
    [summaryData, expandedGroups],
  );'''
if new_flat_items not in source:
    if old_flat_items not in source:
        raise SystemExit("Flat stock matrix anchor not found")
    source = source.replace(old_flat_items, new_flat_items, 1)

path.write_text(source)
