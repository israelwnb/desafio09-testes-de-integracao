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

  it("should be able to get a statement operation", async () => {
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

    const statementResponse = await request(app)
    .post("/api/v1/statements/deposit")
    .send(statement)
    .set({
      Authorization: `Bearer ${token}`
    });

    const statement_id = statementResponse.body.id;

    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.user_id).toEqual(testUser.id);
    expect(response.body.amount).toEqual("150.00");
    expect(response.body.type).toEqual("deposit");
  });

  it("should not be able to get a nonexistent user's statement operation", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "random_user@fin_api.com.br",
      password: "random.password",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.token).toBe(undefined)

    const { token } = responseToken.body;

    const statement_id = uuidV4();

    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(401);
  });

  it("should not be able to get a nonexistent statement operation", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: testUser.email,
      password: testUser.password
    });

    const { token } = responseToken.body;

    const statement_id = uuidV4();

    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(404);
  });
});
