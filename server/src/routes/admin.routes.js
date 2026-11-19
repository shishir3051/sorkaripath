import { Router } from "express";
import { z } from "zod";
import {
  deleteUser,
  getAdminOverview,
  updateUserRole,
} from "../controllers/admin.controller.js";
import { requireAdminRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

const router = Router();

router.use(requireAdminRole);
router.get("/overview", getAdminOverview);
router.patch("/users/:id/role", validateBody(updateRoleSchema), updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
