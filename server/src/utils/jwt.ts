import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/env";
import { JwtPayload } from "../types/auth.types";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (
  plainText: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(plainText, hashed);
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
