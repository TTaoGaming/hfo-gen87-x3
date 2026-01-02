# 🧊 COLD — Archive Manifest

> **Archived Content** | Gen87.X3 | 2026-01-02

---

## 📁 Structure

```
cold/
├── MANIFEST.md           # THIS FILE
├── gold/                 # Archived specifications (EMPTY)
├── silver/               # Archived designs (EMPTY)
└── bronze/               # Archived implementation
    ├── archive_2025-12-31/   # Pre-Gen87.X3 code
    ├── archive_2026-01-01/   # Gen87.X3 early code
    └── archive_demos_2026-01-02/  # Deprecated demos
```

---

## 🛡️ Protection Level

**READ-ONLY** — AI agents MUST NOT modify archived content.

---

## 📦 Archive Inventory

### bronze/archive_2025-12-31/
- Original hot_bronze/ implementation
- Original hot_silver/ demos
- Legacy sandbox demos
- Pre-medallion code

### bronze/archive_2026-01-01/
- Early Gen87.X3 experiments
- Superseded implementations

### bronze/archive_demos_2026-01-02/
- Demos replaced by showcases
- Old numbered demo files

---

## 🔄 Archive Process

When archiving active code:

```bash
# 1. Create dated archive folder
mkdir -p cold/bronze/archive_$(date +%Y-%m-%d)

# 2. Move (not copy) the content
mv hot/bronze/src/deprecated-feature/ cold/bronze/archive_$(date +%Y-%m-%d)/

# 3. Update this MANIFEST
# 4. Commit with message: "archive: Move {feature} to cold storage"
```

---

## 🚫 DO NOT

- ❌ Delete archived content
- ❌ Modify archived content
- ❌ Reference archived content from hot/ (copy if needed)
- ❌ Add new development work to cold/

---

*Gen87.X3 | 2026-01-02*
