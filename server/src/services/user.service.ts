import { User, UserRole, UserStatus } from "@prisma/client";
import { userRepository, UserRepository } from "../repositories/user.repository";
import { AppError, UserResponse } from "../types/auth.types";
import { UpdateUserInput } from "../validators/user.validator";
import { hashPassword } from "../utils/jwt";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  private sanitizeUser(user: User): UserResponse {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userRepo.findAll();
    return users.map((u) => this.sanitizeUser(u));
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError(`User with ID '${id}' not found.`, 404);
    }
    return this.sanitizeUser(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError(`User with ID '${id}' not found.`, 404);
    }

    const updated = await this.userRepo.update(id, input);
    return this.sanitizeUser(updated);
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<UserResponse> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError(`User with ID '${id}' not found.`, 404);
    }

    const updated = await this.userRepo.updateStatus(id, status);
    return this.sanitizeUser(updated);
  }

  async updateUserRole(id: string, role: UserRole): Promise<UserResponse> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError(`User with ID '${id}' not found.`, 404);
    }

    const updated = await this.userRepo.updateRole(id, role);
    return this.sanitizeUser(updated);
  }

  async updateUserPassword(id: string, passwordPlain: string): Promise<UserResponse> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError(`User with ID '${id}' not found.`, 404);
    }

    const hashedPassword = await hashPassword(passwordPlain);
    const updated = await this.userRepo.update(id, { passwordHash: hashedPassword });
    return this.sanitizeUser(updated);
  }
}

export const userService = new UserService(userRepository);
