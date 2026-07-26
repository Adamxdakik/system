from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match in {path}, found {count}: {old[:80]!r}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "client/src/pages/PurchaseOrderEdit.tsx",
    "invalidateAccountingQueries(queryClient, poId);",
    "invalidateAccountingQueries(queryClient, poId ?? undefined);",
)

replace_once(
    "server/index.ts",
    '''    if (source && !source.includes(host)) {
      return res.status(403).json({ message: "CSRF check failed: invalid origin" });
    }
  }
  next();
});''',
    '''    if (source && !source.includes(host)) {
      return res.status(403).json({ message: "CSRF check failed: invalid origin" });
    }
  }
  return next();
});''',
)

routes_path = Path("server/routes.ts")
routes = routes_path.read_text()

schema_anchor = '} from "@shared/schema";\n'
schema_import = 'import * as schema from "@shared/schema";\n'
if schema_import not in routes:
    if routes.count(schema_anchor) != 1:
        raise SystemExit("Shared schema import anchor not found exactly once")
    routes = routes.replace(schema_anchor, schema_anchor + schema_import, 1)

validate_anchor = '''      // Get all stock items for validation
      const allStockItems = await storage.getAllStockItems(req.session.currentCompanyId!);

      // Validate all items in the preview'''
validate_replacement = '''      // Get all stock items and aliases for validation
      const allStockItems = await storage.getAllStockItems(req.session.currentCompanyId!);
      const aliasMap = await storage.getAllStockItemAliasMap(req.session.currentCompanyId!);

      // Validate all items in the preview'''
if routes.count(validate_anchor) != 2:
    raise SystemExit(f"Expected two PO validation alias anchors, found {routes.count(validate_anchor)}")
routes = routes.replace(validate_anchor, validate_replacement, 2)

replacements = [
    (
        '''      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/companies"''',
        '''      return res.json(companies);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/companies"''',
    ),
    (
        '''      res.json({
        fileHash,
        fileName: req.file.originalname,
        rowCount: rows.length,
        preview,
      });
    } catch (error: any) {
      console.error("PO Import parse error:", error);
      res.status(500).json({ message: error.message });
    }
  });''',
        '''      return res.json({
        fileHash,
        fileName: req.file.originalname,
        rowCount: rows.length,
        preview,
      });
    } catch (error: any) {
      console.error("PO Import parse error:", error);
      return res.status(500).json({ message: error.message });
    }
  });''',
    ),
    (
        '''      res.json({
        valid: errors.length === 0,
        errors,
      });
    } catch (error: any) {
      console.error("PO Import validation error:", error);
      res.status(500).json({ message: error.message });
    }
  });''',
        '''      return res.json({
        valid: errors.length === 0,
        errors,
      });
    } catch (error: any) {
      console.error("PO Import validation error:", error);
      return res.status(500).json({ message: error.message });
    }
  });''',
    ),
    (
        '''      res.json({
        success: true,
        containerId: container.id,
        containerNumber: container.containerNumber,
        itemsCount: containerPreview.itemsCount,
        grandTotal: containerPreview.grandTotal,
      });
    } catch (error: any) {
      console.error("PO Import error:", error);
      res.status(500).json({ message: error.message });
    }
  });''',
        '''      return res.json({
        success: true,
        containerId: container.id,
        containerNumber: container.containerNumber,
        itemsCount: containerPreview.itemsCount,
        grandTotal: containerPreview.grandTotal,
      });
    } catch (error: any) {
      console.error("PO Import error:", error);
      return res.status(500).json({ message: error.message });
    }
  });''',
    ),
]

for old, new in replacements:
    count = routes.count(old)
    if count != 1:
        raise SystemExit(f"Expected one route response block, found {count}: {old[:80]!r}")
    routes = routes.replace(old, new, 1)

routes_path.write_text(routes)
