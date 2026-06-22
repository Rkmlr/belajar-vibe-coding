import { describe, it, expect, beforeEach } from "bun:test";
import { userRoutes } from "../src/routes/user-routes";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

beforeEach(async () => {
  // Clear the database tables before each test to ensure data consistency
  // Order is important because of foreign keys (sessions -> users)
  await db.delete(sessions);
  await db.delete(users);
});

describe("User API Registration Suite (POST /api/users)", () => {
  it("should successfully register a user with valid payload", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "mysecurepassword",
        }),
      })
    );
    
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("User berhasil ditambahkan");
    expect(body.data).toBeDefined();
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Test User");
    expect(body.data.email).toBe("test@example.com");
    expect(body.data.password).toBeUndefined();
  });

  it("should fail registration if email is already registered", async () => {
    // Register the first user
    await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User 1",
          email: "duplicate@example.com",
          password: "mysecurepassword",
        }),
      })
    );

    // Try registering the second user with the same email
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User 2",
          email: "duplicate@example.com",
          password: "anotherpassword",
        }),
      })
    );
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email sudah terdaftar");
  });

  it("should fail registration if email format is invalid (no @)", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "invalidemailformat",
          password: "mysecurepassword",
        }),
      })
    );
    
    expect(response.status).toBe(422);
  });

  it("should fail registration if password is too short (< 6 characters)", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "12345",
        }),
      })
    );
    
    expect(response.status).toBe(422);
  });

  it("should fail registration if name is too long (> 255 characters)", async () => {
    const longName = "a".repeat(256);
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: longName,
          email: "test@example.com",
          password: "mysecurepassword",
        }),
      })
    );
    
    expect(response.status).toBe(422);
  });
});

describe("User API Login Suite (POST /api/users/login)", () => {
  beforeEach(async () => {
    // Pre-register a user for login tests
    await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login User",
          email: "login@example.com",
          password: "mysecurepassword",
        }),
      })
    );
  });

  it("should successfully login with correct credentials and return a token", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login User",
          email: "login@example.com",
          password: "mysecurepassword",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("User berhasil login");
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");
  });

  it("should fail login with correct email but incorrect password", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login User",
          email: "login@example.com",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email atau password salah");
  });

  it("should fail login if email is not registered", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login User",
          email: "notregistered@example.com",
          password: "mysecurepassword",
        }),
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email atau password salah");
  });

  it("should fail login with invalid payload validation", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          email: "invalidemail",
          password: "123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });
});

describe("User API Get Current User Suite (GET /api/users/current)", () => {
  let validToken: string;

  beforeEach(async () => {
    // Register
    await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Current User",
          email: "current@example.com",
          password: "mysecurepassword",
        }),
      })
    );

    // Login
    const loginResponse = await userRoutes.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Current User",
          email: "current@example.com",
          password: "mysecurepassword",
        }),
      })
    );
    const loginBody = await loginResponse.json();
    validToken = loginBody.data;
  });

  it("should successfully get current user profile with valid token", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${validToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe("Current User");
    expect(body.data.email).toBe("current@example.com");
    expect(body.data.id).toBeDefined();
  });

  it("should fail to get current user if Authorization header is missing", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should fail to get current user if token is invalid", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          "Authorization": "Bearer invalidtoken12345",
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});

describe("User API Logout Suite (DELETE /api/users/logout)", () => {
  let validToken: string;

  beforeEach(async () => {
    // Register
    await userRoutes.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Logout User",
          email: "logout@example.com",
          password: "mysecurepassword",
        }),
      })
    );

    // Login
    const loginResponse = await userRoutes.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Logout User",
          email: "logout@example.com",
          password: "mysecurepassword",
        }),
      })
    );
    const loginBody = await loginResponse.json();
    validToken = loginBody.data;
  });

  it("should successfully logout user and delete session", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${validToken}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBe("OK");

    // Verify token is no longer valid
    const currentResponse = await userRoutes.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${validToken}`,
        },
      })
    );
    expect(currentResponse.status).toBe(401);
  });

  it("should fail logout if token is already logged out (double logout)", async () => {
    // First logout
    const response1 = await userRoutes.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${validToken}`,
        },
      })
    );
    expect(response1.status).toBe(200);

    // Second logout
    const response2 = await userRoutes.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${validToken}`,
        },
      })
    );
    expect(response2.status).toBe(401);
    const body2 = await response2.json();
    expect(body2.error).toBe("Unauthorized");
  });

  it("should fail logout if Authorization header is missing", async () => {
    const response = await userRoutes.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
