import { app } from "../../../../app";
import request from "supertest";
import { Connection } from "typeorm";

import createConnection from "../../../../database";
import { v4 as uuidV4} from "uuid";
import { hash } from "bcryptjs";

let connection: Connection;
let testUser: {
  id: string;
  name: string;
  email: string;
  password: string;
}

describe("Create Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    testUser = {
        id: uuidV4(),
        name: "admin",
        email: "admin@fin_api.com.br",
        password: "admin",
    }

    const password = await hash(testUser.password, 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password)
      values('${testUser.id}', '${testUser.name}', '${testUser.email}', '${password}')
    `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get an user's balance", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: testUser.email,
      password: testUser.password
    });

    const { token } = responseToken.body;

    const deposit = {

      amount: 150,
      description: "monthly income"
    }

    await request(app)
    .post("/api/v1/statements/deposit")
    .send(deposit)
    .set({
      Authorization: `Bearer ${token}`
    });

    const withdraw = {

      amount: 50,
      description: "income tax"
    }

    await request(app)
    .post("/api/v1/statements/withdraw")
    .send(withdraw)
    .set({
      Authorization: `Bearer ${token}`
    });

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body.statement[0]).toHaveProperty("id");
    expect(response.body.statement.length).toBe(2);
    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toEqual(100);
  });

  it("should not be able to get a nonexistent user's balance", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "random_user@fin_api.com.br",
      password: "random.password",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.token).toBe(undefined)

    const { token } = responseToken.body;

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(401);
  });
});
