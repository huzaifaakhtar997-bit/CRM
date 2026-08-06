import { User, Prisma, UserStatus, UserRole } from "@prisma/client";
import { prisma } from "../config/database";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}

export const userRepository = new UserRepository();
