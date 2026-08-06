import { User } from "@prisma/client";
import { userRepository, UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePasswords, generateToken } from "../utils/jwt";
import { RegisterInput, LoginInput } from "../validators/auth.validator";
import { AppError, AuthResponseData, UserResponse } from "../types/auth.types";

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  private sanitizeUser(user: User): UserResponse {
    // Exclude passwordHash from user response
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async register(input: RegisterInput): Promise<AuthResponseData> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new AppError("An account with this email address already exists.", 400);
    }

    const hashedPassword = await hashPassword(input.password);

    const newUser = await this.userRepo.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: hashedPassword,
      role: input.role,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResponseData> {
    const user = await this.userRepo.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new AppError("Invalid email or password credentials.", 401);
    }

    const isPasswordValid = await comparePasswords(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password credentials.", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Your user account has been deactivated.", 403);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError("Authenticated user not found.", 404);
    }
    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService(userRepository);
