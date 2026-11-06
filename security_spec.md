# Security Specification

## 1. Data Invariants
1. Orders must have a valid string `orderId`, `status`, and non-negative `total`.
2. Anyone (guest buyers) can create an order with a valid structure upon completing checkout.
3. Inventory can be read by any client to display real-time stock availability.
4. Inventory stock counts (`S`, `M`, `L`) must be integers between 0 and 1000.
5. Promo redemptions cannot be duplicated once marked redeemed.
6. Order modifications (status changes, tracking numbers) require authorized store owner access.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. Order with negative total: `{ orderId: "ORD-1", total: -15.00, status: "Pending" }` -> DENIED.
2. Order without orderId: `{ total: 10.99, status: "Pending" }` -> DENIED.
3. Order with 2MB payload string injection -> DENIED.
4. Inventory write with negative stock count: `{ S: -1, M: 0, L: 0 }` -> DENIED.
5. Inventory write with non-numeric sizes: `{ S: "five", M: 1, L: 0 }` -> DENIED.
6. Malicious promo override: `{ code: "G1VEAWAY013", redeemed: false }` -> DENIED.
7. Unauthenticated delete of orders collection -> DENIED.
8. Unauthenticated delete of inventory collection -> DENIED.
9. Order update attempting to zero out completed transaction amounts -> DENIED.
10. Junk document ID injection exceeding 128 characters -> DENIED.
11. Arbitrary collection root write -> DENIED.
12. Status spoofing to non-standard value: `{ status: "FREE_HACK" }` -> DENIED.
