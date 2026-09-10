# Security Specification & Test Suite for Firestore Rules

## 1. Data Invariants
1. **Default Deny**: All paths default to `allow read, write: if false;`.
2. **Identity Integrity**: A user can only read, create, update, or delete their own user document (`/users/{userId}` where `userId == request.auth.uid`).
3. **Sub-resource Isolation**: Saved jerseys located at `/users/{userId}/jerseys/{jerseyId}` are owned exclusively by `userId`. An attacker cannot access or tamper with another user's jersey designs.
4. **Relational Invariant**: `incoming().userId` must strictly match the parent `userId` path variable and `request.auth.uid`.
5. **No Spoofing & No Blanket Lists**: `allow list` explicitly enforces `resource.data.userId == request.auth.uid` or subcollection ownership.
6. **Path Variable Hardening**: Document IDs and path variables are validated via `isValidId()`.
7. **Temporal & Immutable Fields**: Creation timestamp `createdAt` is immutable upon update; timestamps use server `request.time`.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Identity Theft - Users)**: Unauthenticated write to `/users/attacker-uid`. Expect: `PERMISSION_DENIED`.
2. **Payload 2 (Cross-User Write - Users)**: User A (`uid_1`) tries to write or overwrite `/users/uid_2`. Expect: `PERMISSION_DENIED`.
3. **Payload 3 (Cross-User Read - Users)**: User A (`uid_1`) tries to read private profile of User B at `/users/uid_2`. Expect: `PERMISSION_DENIED`.
4. **Payload 4 (Orphaned Jersey Write)**: User writes to `/users/{userId}/jerseys/{jerseyId}` where `incoming().userId != userId`. Expect: `PERMISSION_DENIED`.
5. **Payload 5 (Cross-User Subcollection Read)**: User A queries `/users/{uid_B}/jerseys`. Expect: `PERMISSION_DENIED`.
6. **Payload 6 (Shadow Update / Ghost Field)**: Updating a jersey with unexpected admin field `{ role: "admin" }` or ghost attributes. Expect: `PERMISSION_DENIED`.
7. **Payload 7 (Path Traversal / Junk ID)**: Creating jersey with 1KB non-alphanumeric document ID. Expect: `PERMISSION_DENIED`.
8. **Payload 8 (Immortal Field Tampering)**: Modifying `createdAt` or `userId` during an update. Expect: `PERMISSION_DENIED`.
9. **Payload 9 (Denial of Wallet String Injection)**: Injecting a 2MB string into `name` or `baseColor`. Expect: `PERMISSION_DENIED`.
10. **Payload 10 (Type Poisoning)**: Setting `roughness` or `metalness` to a boolean or object instead of a number. Expect: `PERMISSION_DENIED`.
11. **Payload 11 (Unauthenticated List Query)**: Running list queries across all users or jerseys without auth token. Expect: `PERMISSION_DENIED`.
12. **Payload 12 (Root Catch-All Bypass)**: Attempting write to arbitrary collection `/system_secrets/keys`. Expect: `PERMISSION_DENIED`.
