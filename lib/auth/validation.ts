import { z } from "zod";
export const signInSchema=z.object({email:z.string().trim().email(),password:z.string().min(1)});
export const signUpSchema=z.object({displayName:z.string().trim().min(1).max(100),email:z.string().trim().email(),password:z.string().min(8).max(128)});
