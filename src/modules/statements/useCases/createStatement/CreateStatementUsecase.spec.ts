import { OperationType } from "@modules/statements/entities/Statement";
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

describe("Create Statement", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  });

  it("should be able to create a statement", async () => {
    const user = {
      name: 'Israel',
      email: 'israel@rocketseat.com.br',
      password: '1234'
    };

    const createdUser = await createUserUseCase.execute(user);

    expect(createdUser).toHaveProperty("id");

    const user_id = createdUser.id;

    const statement: ICreateStatementDTO = {
      user_id,
      type: "deposit" as OperationType,
      amount: 1500,
      description: "monthly income"
    }

    const createdStatement = await createStatementUseCase.execute(statement);

    expect(createdStatement).toHaveProperty("id");
    expect(createdStatement.user_id).toEqual(user_id);
    expect(createdStatement.amount).toEqual(statement.amount);
    expect(createdStatement.type).toEqual(statement.type);
  });

  it("should not be able to create a statement for a nonexistent user", async () => {
    expect(async () => {
      const user_id = "random_user_id";

      const statement: ICreateStatementDTO = {
        user_id,
        type: "deposit" as OperationType,
        amount: 1500,
        description: "monthly income"
      }

      await createStatementUseCase.execute(statement);
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("should not be able to create a withdraw statement without enough funds", async () => {
    expect(async () => {
      const user = {
        name: 'Israel',
        email: 'israel@rocketseat.com.br',
        password: '1234'
      };

      const createdUser = await createUserUseCase.execute(user);

      expect(createdUser).toHaveProperty("id");

      const user_id = createdUser.id;

      const statement: ICreateStatementDTO = {
        user_id,
        type: "withdraw" as OperationType,
        amount: 1500,
        description: "lottery bet"
      }

      await createStatementUseCase.execute(statement);
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
})
