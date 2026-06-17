const request = require("supertest");
const app = require("../server");

describe("LuxeStay API Tests", () => {
  
  // Test GET /api/listings
  test("GET /api/listings should return all staying listings", async () => {
    const response = await request(app).get("/api/listings");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty("title");
    expect(response.body[0]).toHaveProperty("price");
  });

  // Test GET /api/bookings
  test("GET /api/bookings should return the list of bookings", async () => {
    const response = await request(app).get("/api/bookings");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(0);
  });

  // Test POST /api/bookings
  test("POST /api/bookings should successfully create a valid booking", async () => {
    const today = new Date();
    today.setDate(today.getDate() + 2); // 2 days in the future
    const checkInStr = today.toISOString().split("T")[0];
    
    today.setDate(today.getDate() + 3); // 5 days in the future
    const checkOutStr = today.toISOString().split("T")[0];

    const bookingPayload = {
      listingId: 1,
      guestName: "Alice Smith",
      email: "alice@example.com",
      checkIn: checkInStr,
      checkOut: checkOutStr
    };

    const response = await request(app)
      .post("/api/bookings")
      .send(bookingPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.guestName).toBe("Alice Smith");
    expect(response.body.totalCost).toBe(3 * 350); // 3 nights * $350
  });

  test("POST /api/bookings should fail if check-in is in the past", async () => {
    const checkInStr = "2020-01-01";
    const checkOutStr = "2020-01-05";

    const bookingPayload = {
      listingId: 1,
      guestName: "Alice Smith",
      email: "alice@example.com",
      checkIn: checkInStr,
      checkOut: checkOutStr
    };

    const response = await request(app)
      .post("/api/bookings")
      .send(bookingPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("cannot be in the past");
  });

  test("POST /api/bookings should fail if email format is invalid", async () => {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    const checkInStr = today.toISOString().split("T")[0];
    today.setDate(today.getDate() + 3);
    const checkOutStr = today.toISOString().split("T")[0];

    const bookingPayload = {
      listingId: 1,
      guestName: "Alice Smith",
      email: "invalidemail-no-at-sign",
      checkIn: checkInStr,
      checkOut: checkOutStr
    };

    const response = await request(app)
      .post("/api/bookings")
      .send(bookingPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Invalid email");
  });

  // Test DELETE /api/bookings/:id
  test("DELETE /api/bookings/:id should successfully delete booking", async () => {
    // We have booking with id 1 pre-populated
    const response = await request(app).delete("/api/bookings/1");
    expect(response.status).toBe(200);
    expect(response.body.message).toContain("successfully");

    // Verify it is gone
    const checkResponse = await request(app).get("/api/bookings");
    const found = checkResponse.body.some(b => b.id === 1);
    expect(found).toBe(false);
  });

  test("DELETE /api/bookings/:id should return 404 for non-existent booking", async () => {
    const response = await request(app).delete("/api/bookings/9999");
    expect(response.status).toBe(404);
  });
});
