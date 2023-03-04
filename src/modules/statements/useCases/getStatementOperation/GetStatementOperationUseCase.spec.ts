import { OperationType } from "@modules/statements/entities/Statement";
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

describe("Create Statement", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  });

  it("should be able to get a statement operation", async () => {
    const user = {
      name: 'Israel',
      email: 'israel@rocketseat.com.br',
      password: '1234'
    };

    const createdUser = await createUserUseCase.execute(user);

    expect(createdUser).toHaveProperty("id");

    const user_id = createdUser.id;

    const deposit: ICreateStatementDTO = {
      user_id,
      type: "deposit" as OperationType,
      amount: 1500,
      description: "monthly income"
    };

    await createStatementUseCase.execute(deposit);

    const withdraw: ICreateStatementDTO = {
      user_id,
      type: "withdraw" as OperationType,
      amount: 500,
      description: "income tax"
    };

    const createdWithdraw = await createStatementUseCase.execute(withdraw);

    expect(createdWithdraw).toHaveProperty("id");
    const statement_id = createdWithdraw.id;

    const fetchedStatement = await getStatementOperationUseCase.execute({
      user_id,
      statement_id
    });

    expect(fetchedStatement).toHaveProperty("id");
    expect(fetchedStatement.id).toEqual(statement_id);
    expect(fetchedStatement.user_id).toEqual(user_id)
    expect(fetchedStatement.type).toEqual(withdraw.type)
    expect(fetchedStatement.amount).toEqual(withdraw.amount)
  });

  it("should not be able to get a nonexistent user's statement operation", async () => {
    expect(async () => {
      const user_id = "random_user_id";
      const statement_id = "random_statement_id";

      await getStatementOperationUseCase.execute({
        user_id,
        statement_id
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it("should not be able to get a nonexistent statement operation", async () => {
    expect(async () => {
      const user = {
        name: 'Israel',
        email: 'israel@rocketseat.com.br',
        password: '1234'
      };

      const createdUser = await createUserUseCase.execute(user);

      expect(createdUser).toHaveProperty("id");

      const user_id = createdUser.id;
      const statement_id = "random_statement_id";

      await getStatementOperationUseCase.execute({
        user_id,
        statement_id
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
});
