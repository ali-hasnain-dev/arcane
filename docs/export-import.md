# Export & Import

## Export & Import

### Export

```php
public static function exportable(): bool { return true; }

// Customise exported columns
public static function getExportColumns(): array
{
    return ['id' => 'ID', 'name' => 'Name', 'email' => 'Email'];
}
```

An **Export CSV** button appears in the table toolbar. Data streams directly — no memory issues for large datasets.

### Import

```php
public static function importable(): bool { return true; }

// Map CSV headers → DB columns
public static function getImportColumns(): array
{
    return ['Name' => 'name', 'Email' => 'email'];
}
```

An **Import** button opens a 3-step wizard:

1. Upload CSV file (drag-and-drop or browse)
2. Preview first 10 rows + drag-to-remap columns
3. Confirm — validates and inserts all rows

---
