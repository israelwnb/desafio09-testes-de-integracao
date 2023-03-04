import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { compare } from "bcryptjs";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let showUserProfileUseCase: ShowUserProfileUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Authenticate User", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepositoryInMemory);
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  });

  it("should be able to show an user's profile", async () => {
    const user = {
      name: 'Israel',
      email: 'israel@rocketseat.com.br',
      password: '1234'
    };

    const createdUser = await createUserUseCase.execute(user);

    expect(createdUser).toHaveProperty("id");

    const fetchedUser = await showUserProfileUseCase.execute(createdUser.id)

    const passwordMatches = await compare(user.password, fetchedUser.password);

    expect(fetchedUser).toHaveProperty("id");
    expect(fetchedUser.email).toEqual(user.email);
    expect(fetchedUser.name).toEqual(user.name);
    expect(passwordMatches).toBe(true);
  });

  it("should not be able to show a nonexistent user's profile", async() => {
    expect(async () => {
      const user_id = "random_user_id";
      await showUserProfileUseCase.execute(user_id);
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  });
});
