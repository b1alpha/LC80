# LC80 Data Schema

> Claude: reference this when adding entries to data.json. Ask for required fields one at a time. Never accept a status value not in the allowed list.

---

## Build

**Required:** `category` (existing card name or new), `status`, `name`
**Optional:** `note`, `tags[]`

**Allowed `status`:** `installed` | `planned` | `urgent` | `on_hand` | `ordered`

**Allowed `tags`:** `INSTALLED` | `PLANNED` | `DO FIRST` | `PARTS ON HAND` | `ORDERED`

**Existing categories:** Engine / Power · Drivetrain / Axles · Offroad Capability · Suspension · Cooling / Fluids · Body / Paint · Interior / Electrical

---

## Fluid Guide

**Required:** `system`, `spec`, `capacity`, `buy_amount`, `brand`, `status`
**Optional:** `notes`

**Allowed `status`:** `locked` | `tracker-based` | `pending`

---

## 2026 Strategy (includes the former Project Tracker)

**Required:** `phase`, `task`, `who`, `priority`
**Optional:** `category`, `status`, `cost_cad`, `time`, `notes`, `on_hand`, `still_needed`, `checked` (default: false), `id` (slug)

**Allowed `priority`:** `urgent` | `done` | `low` — drives row colour. `checked` must be `true` exactly when `priority` is `done`.

**Allowed `status`:** `URGENT SERVICE` | `NEEDS INVESTIGATION` | `BROKEN — REPLACE` | `NEEDS PARTS` | `ONGOING TRACKING` | `LEAKING — NEEDS BOOKING` | `NEEDS BOOKING` | `SHOP JOB (Pending)` | `PLANNING QUOTE` | `DEFERRED TO REBUILD` | `SCHEDULED 2026/27` | `CAN DO NOW` | `DONE`

`notes`, `on_hand`, and `still_needed` each render as a sub-row under the task. Omit the field (do not use `null` or `"None"`) when there is nothing to say.

**Existing phases:**
- `PHASE 1 — 2024/2025 | Completed Groundwork` (done-only history)
- `PHASE 2 — SPRING 2026 | Safety + Driveability + Pre-Summer`
- `PHASE 3 — SUMMER/FALL 2026 | Cosmetic + Comfort + Rebuild Prep`
- `PHASE 4 — ENGINE REBUILD PLANNING (Late 2026 / 2027)`

**Existing categories:** AC · Body / Maint. · Body / Paint · Brakes / Safety · Drivetrain · Drivetrain / Fluids · Electrical · Electrical / Body · Electrical / Engine · Electrical / Interior · Engine · Engine / Fuel · Engine / Maint. · Engine / Vacuum · Engine Monitoring · Exhaust · Interior · Interior / Audio · Suspension

---

## Parts Inventory

**Required:** `name`, `vendor`, `status`
**Optional:** `part_number`, `price_paid`, `currency`, `approx_cad`, `project`

**Allowed `status`:** `installed` | `on_hand` | `sold` | `used` | `reference`

**Allowed `currency`:** `CAD` | `USD` | `AUD`

---

## Spend Summary

**Required:** `date`, `vendor`, `description`, `amount_cad`
**Optional:** `is_total` (default: false)

**Date format:** `YYYY-MM` or `YYYY-MM-DD` or `YYYY` for approximate dates

---

## Scheduled Maintenance

**Required:** `item`, `interval`, `last_done_km`, `status`
**Optional:** `last_done_notes`, `next_due_km`, `km_until_due`, `notes`, `status_label`

**Allowed `status`:** `ok` | `upcoming` | `overdue` | `urgent` | `deferred` | `due_soon`

---

## Shop Contacts

**Required:** `name`, `role`, `specialty`
**Optional:** `location`, `phone`, `contact`
