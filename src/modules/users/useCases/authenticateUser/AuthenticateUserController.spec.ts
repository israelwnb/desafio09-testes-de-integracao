import { app } from "../../../../app";
import request from "supertest";
import { Connection } from "typeorm";

import createConnection from "../../../../database";
import { v4 as uuidV4} from "uuid";
import { hash } from "bcryptjs";

let connection: Connection;
let testUser: {
  name: string;
  email: string;
  password: string;
}

describe("Authenticate User",() => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    testUser = {
        name: "admin",
        email: "admin@fin_api.com.br",
        password: "admin"
    }

    const id = uuidV4();
    const password = await hash(testUser.password, 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password)
      values('${id}', '${testUser.name}', '${testUser.email}', '${password}')
    `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate an user", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: testUser.email,
      password: testUser.password
    });

    const { token } = responseToken.body;

    expect(responseToken.body).toHaveProperty("token")
    expect(responseToken.body.user.email).toEqual(testUser.email)
    expect(token).not.toBeUndefined()
  });

  it("should not be able to authenticate a nonexistent user", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "random_mail@fin_api.com.br",
      password: "random_password"
    });

    expect(responseToken.status).toBe(401);
    expect(responseToken.body.token).toBe(undefined);
  });

  it("should not be able to authenticate an user with wrong password", async () => {
    const responseToken = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: testUser.email,
      password: "random_password"
    });

    expect(responseToken.status).toBe(401);
    expect(responseToken.body.token).toBe(undefined);
  });
})
