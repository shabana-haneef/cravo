import { userRepository } from "../users/user.repository.js";

import { AppError } from "../../shared/errors/AppError.js";

import { hashPassword } from "../../shared/utils/password.js";

export const authService = {
  async register(data) {
    const existingUser =
      await userRepository.findByEmail(
        data.email
      );

    if (existingUser) {
      throw new AppError(
        "Email already exists",
        409
      );
    }

    const passwordHash =
      await hashPassword(
        data.password
      );

    const user =
      await userRepository.create({
        email: data.email,

        passwordHash,

        role: "CUSTOMER",
      });

    return user;
  },
};