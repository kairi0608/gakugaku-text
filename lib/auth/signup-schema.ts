import { z } from "zod";

export const publicSignupRoles = ["personal", "student", "teacher"] as const;
export const signupRoleSchema = z.enum(publicSignupRoles);
export type PublicSignupRole = z.infer<typeof signupRoleSchema>;

