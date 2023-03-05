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

  it("should be able to create a statement", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: testUser.email,
      password: testUser.password
    });

    const { token } = responseToken.body;

    const statement = {

      amount: 150,
      description: "monthly income"
    }

    const response = await request(app)
    .post("/api/v1/statements/deposit")
    .send(statement)
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.user_id).toEqual(testUser.id)
    expect(response.body.amount).toBe(150)
    expect(response.body.type).toEqual("deposit")
  });

  it("should not be able to create a statement for a nonexistent user", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "random_user@fin_api.com.br",
      password: "random.password",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.token).toBe(undefined)

    const { token } = responseToken.body;

    const statement = {

      amount: 150,
      description: "monthly income"
    }

    const response = await request(app)
    .post("/api/v1/statements/deposit")
    .send(statement)
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(401);
  });

  it("should not be able to create a withdraw statement without enough funds", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: testUser.email,
      password: testUser.password
    });

    const { token } = responseToken.body;

    const statement = {

      amount: 500,
      description: "lottery bet"
    }

    const response = await request(app)
    .post("/api/v1/statements/withdraw")
    .send(statement)
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(400);
  });
});
