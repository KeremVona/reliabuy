# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: properties/user-dashboards.spec.ts >> User Dashboards (My Listings & Saved Properties) >> TC-FUNC-MYLIST-001: Authenticated user retrieves only their own published properties
- Location: tests/e2e/properties/user-dashboards.spec.ts:85:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import {
  3   |   clearDatabase,
  4   |   seedTestProperty,
  5   |   seedTestUser,
  6   | } from "../../../test-utils/db";
  7   | 
  8   | test.describe("User Dashboards (My Listings & Saved Properties)", () => {
  9   |   let userAToken: string;
  10  |   let userBToken: string;
  11  |   let userAId: number;
  12  |   let userBId: number;
  13  |   let sharedPropertyId: number; // A property published by B, but favorited by A
  14  | 
  15  |   test.beforeEach(async ({ request }) => {
  16  |     // 1. Wipe the test database
  17  |     await clearDatabase();
  18  | 
  19  |     // 2. Seed User A
  20  |     const userAData = await seedTestUser(
  21  |       "userA@example.com",
  22  |       "password123",
  23  |       "fullname",
  24  |       "city",
  25  |     );
  26  |     userAId = userAData.id;
  27  |     const loginA = await request.post("http://localhost:5000/api/auth/login", {
  28  |       data: { email: "userA@example.com", password: "password123" },
  29  |     });
  30  | 
  31  |     console.log("test2", loginA.status());
  32  |     // expect(loginA.status()).toBe(200);
  33  | 
  34  |     userAToken = (await loginA.json()).jwtToken;
  35  |     console.log("test", await loginA.json());
  36  | 
  37  |     // 3. Seed User B
  38  |     const userBData = await seedTestUser(
  39  |       "userB@example.com",
  40  |       "password123",
  41  |       "fullnametwo",
  42  |       "city",
  43  |     );
  44  |     userBId = userBData.id;
  45  |     const loginB = await request.post("http://localhost:5000/api/auth/login", {
  46  |       data: { email: "userB@example.com", password: "password123" },
  47  |     });
  48  |     userBToken = (await loginB.json()).jwtToken;
  49  | 
  50  |     // 4. Seed Properties
  51  |     // User A publishes 2 properties
  52  |     await seedTestProperty({
  53  |       user_id: userAId,
  54  |       title: "User A Villa 1",
  55  |       description: "...",
  56  |       price: 100,
  57  |       address: "...",
  58  |     });
  59  |     await seedTestProperty({
  60  |       user_id: userAId,
  61  |       title: "User A Villa 2",
  62  |       description: "...",
  63  |       price: 200,
  64  |       address: "...",
  65  |     });
  66  | 
  67  |     // User B publishes 1 property
  68  |     sharedPropertyId = await seedTestProperty({
  69  |       user_id: userBId,
  70  |       title: "User B Condo",
  71  |       description: "...",
  72  |       price: 300,
  73  |       address: "...",
  74  |     });
  75  | 
  76  |     // 5. User A favorites User B's property
  77  |     await request.post(
  78  |       `http://localhost:5000/api/property/${sharedPropertyId}/favorite`,
  79  |       {
  80  |         headers: { Authorization: `Bearer ${userAToken}` },
  81  |       },
  82  |     );
  83  |   });
  84  | 
  85  |   test("TC-FUNC-MYLIST-001: Authenticated user retrieves only their own published properties", async ({
  86  |     request,
  87  |   }) => {
  88  |     // User A requests their listings
  89  |     const response = await request.get(
  90  |       "http://localhost:5000/api/property/my-listings",
  91  |       {
  92  |         headers: { Authorization: `Bearer ${userAToken}` },
  93  |       },
  94  |     );
  95  | 
> 96  |     expect(response.status()).toBe(200);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  97  |     const responseBody = await response.json();
  98  | 
  99  |     // User A should have exactly 2 properties
  100 |     expect(responseBody.count).toBe(2);
  101 |     expect(responseBody.data.length).toBe(2);
  102 | 
  103 |     // Ensure User B's condo did not leak into User A's listings
  104 |     const titles = responseBody.data.map((p: any) => p.title);
  105 |     expect(titles).toContain("User A Villa 1");
  106 |     expect(titles).toContain("User A Villa 2");
  107 |     expect(titles).not.toContain("User B Condo");
  108 |   });
  109 | 
  110 |   test("TC-FUNC-MYLIST-002: Server blocks unauthenticated access to My Listings", async ({
  111 |     request,
  112 |   }) => {
  113 |     const response = await request.get(
  114 |       "http://localhost:5000/api/property/my-listings",
  115 |     );
  116 |     expect(response.status()).toBe(401);
  117 |   });
  118 | 
  119 |   test("TC-FUNC-MYSAVED-001: Authenticated user retrieves only their favorited properties", async ({
  120 |     request,
  121 |   }) => {
  122 |     // User A requests their saved properties
  123 |     const response = await request.get(
  124 |       "http://localhost:5000/api/property/saved",
  125 |       {
  126 |         headers: { Authorization: `Bearer ${userAToken}` },
  127 |       },
  128 |     );
  129 | 
  130 |     expect(response.status()).toBe(200);
  131 |     const responseBody = await response.json();
  132 | 
  133 |     // User A favorited exactly 1 property (User B's Condo)
  134 |     expect(responseBody.count).toBe(1);
  135 |     expect(responseBody.data[0].id).toBe(sharedPropertyId);
  136 |     expect(responseBody.data[0].title).toBe("User B Condo");
  137 |   });
  138 | 
  139 |   test("TC-FUNC-MYSAVED-002: Server blocks unauthenticated access to Saved Properties", async ({
  140 |     request,
  141 |   }) => {
  142 |     const response = await request.get(
  143 |       "http://localhost:5000/api/property/saved",
  144 |     );
  145 |     expect(response.status()).toBe(401);
  146 |   });
  147 | 
  148 |   test("TC-FUNC-MYSAVED-003: Authenticated user retrieves an empty array when no properties are saved", async ({
  149 |     request,
  150 |   }) => {
  151 |     // User B has not favorited any properties during setup
  152 |     const response = await request.get(
  153 |       "http://localhost:5000/api/property/saved",
  154 |       {
  155 |         headers: { Authorization: `Bearer ${userBToken}` },
  156 |       },
  157 |     );
  158 | 
  159 |     expect(response.status()).toBe(200);
  160 |     const responseBody = await response.json();
  161 | 
  162 |     // EXPECTED: Safely returns an empty array instead of null or crashing
  163 |     expect(responseBody.count).toBe(0);
  164 |     expect(responseBody.data).toEqual([]);
  165 |   });
  166 | });
  167 | 
```