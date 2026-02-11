Admin Dashboard APIs

Endpoints (POST):

- `/api/admin/dashboard/orders` — body: `{ startDate?, endDate?, period?('today'|'week'|'month'|'year') }`. Returns order KPIs, status counts, trend.
- `/api/admin/dashboard/inventory` — body: `{ threshold?, storeId?, categoryId? }`. Returns medicine counts, low-stock and expired lists.
- `/api/admin/dashboard/revenue` — body: `{ startDate?, endDate?, period? }`. Returns revenue KPIs, trend and previous-period comparison.

Notes:

- Endpoints use `dbConnect()` and existing `Order` / `Medicine` models.
- Date ranges default to the current month when not provided.
