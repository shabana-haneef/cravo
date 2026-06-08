import { authService } from "./auth.service.js";

import { successResponse } from "../../shared/responses/apiResponse.js";

export const register =
  async (
    req,
    res
  ) => {
    const user =
      await authService.register(
        req.body
      );

    return successResponse(
      res,
      "Registration successful",
      {
        userId: user.id,
        email: user.email,
      },
      201
    );
  };