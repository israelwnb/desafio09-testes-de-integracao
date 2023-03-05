import { app } from "../../../../app";
import request from "supertest";
import { Connection } from "typeorm";

import createConnection from "../../../../database";

let connection: Connection;
describe("Create User",() => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new user", async () => {
    const response = await request(app)
    .post("/api/v1/users")
    .send({
      name: "Israel",
      email: "israel@rocketseat.com.br",
      password: "1234"
    });

    expect(response.status).toBe(201);
  });

  it("should not be able to create a new user with existing e-mail", async () => {
    const response = await request(app)
    .post("/api/v1/users")
    .send({
      name: "Wilson",
      email: "israel@rocketseat.com.br",
      password: "4321"
    });

    expect(response.status).toBe(400);
  });
})
