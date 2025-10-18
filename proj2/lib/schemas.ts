import { z } from "zod";

/** ==== Spin ==== */
export const ConstraintsSchema = z.object({
  dietFlags: z.record(z.boolean()).optional(),
  allergens: z.array(z.string()).optional(),
  budgetMax: z.number().int().optional(),
  timeMaxMin: z.number().int().optional()
}).optional();

export const PowerUpsSchema = z.object({
  healthy: z.number().min(0).max(1),
  cheap: z.number().min(0).max(1),
  t30: z.number().min(0).max(1)
}).optional();

export const SpinRequestSchema = z.object({
  categories: z.array(z.string()).min(1).max(6),
  locked: z.record(z.string()).optional(),
  powerUps: PowerUpsSchema,
  constraints: ConstraintsSchema,
  seed: z.string().optional()
});

export type SpinRequest = z.infer<typeof SpinRequestSchema>;

export const SpinResponseSchema = z.object({
  result: z.array(z.string()),
  debug: z.object({
    candidates: z.array(z.array(z.string())),
    scores: z.array(z.array(z.number())),
    seed: z.string()
  })
});

export type SpinResponse = z.infer<typeof SpinResponseSchema>;

/** ==== Recipe ==== */
export const RecipeRequestSchema = z.object({
  dishes: z.array(z.string()).min(1)
});
export type RecipeRequest = z.infer<typeof RecipeRequestSchema>;

export const RecipeIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: z.string()
});

export const RecipeResponseSchema = z.object({
  title: z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  steps: z.array(z.string()).min(1),
  equipment: z.array(z.string()),
  nutrition: z.object({
    kcal: z.number().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative().optional().default(0),
    fat_g: z.number().nonnegative().optional().default(0)
  }),
  shoppingList: z.array(z.string()),
  warnings: z.array(z.string())
});
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;

/** ==== Party Socket Types ==== */
export const CreateSessionSchema = z.object({ nickname: z.string().min(1) });
export const JoinSessionSchema = z.object({ code: z.string().length(6), nickname: z.string().min(1) });
export const UpdateConstraintsSchema = z.object({
  dietFlags: z.record(z.boolean()).optional(),
  allergens: z.array(z.string()).optional(),
  budgetMax: z.number().int().optional(),
  timeMaxMin: z.number().int().optional()
});
export const LockReelSchema = z.object({ reelIndex: z.number().int().min(0), dishName: z.string() });
export const UnlockReelSchema = z.object({ reelIndex: z.number().int().min(0) });
export const UpdatePowerUpsSchema = z.object({ healthy: z.number().optional(), cheap: z.number().optional(), t30: z.number().optional() });
export const SpinReqSchema = z.object({ seed: z.string().optional() });

export type SessionMember = {
  id: string;
  nickname: string;
  constraints: z.infer<typeof UpdateConstraintsSchema>;
};

export type SessionState = {
  code: string;
  members: SessionMember[];
  mergedConstraints: {
    dietFlags?: Record<string, boolean>;
    allergens?: string[];
    budgetMax?: number;
    timeMaxMin?: number;
  };
  state: Record<string, unknown>;
};
