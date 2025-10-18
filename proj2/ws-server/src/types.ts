import { z } from "zod";

export const CreateSessionZ = z.object({ nickname: z.string().min(1) });
export const JoinSessionZ = z.object({ code: z.string().length(6), nickname: z.string().min(1) });
export const UpdateConstraintsZ = z.object({
  dietFlags: z.record(z.boolean()).optional(),
  allergens: z.array(z.string()).optional(),
  budgetMax: z.number().int().optional(),
  timeMaxMin: z.number().int().optional()
});
export const UpdatePowerUpsZ = z.object({
  healthy: z.number().optional(),
  cheap: z.number().optional(),
  t30: z.number().optional()
});
export const SpinReqZ = z.object({ seed: z.string().optional() });

export type SessionMember = {
  id: string;
  nickname: string;
  constraints: z.infer<typeof UpdateConstraintsZ>;
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

export type ServerToClientEvents = {
  session_state: (s: SessionState) => void;
  member_joined: (m: SessionMember) => void;
  member_left: (id: string) => void;
  spin_result: (payload: { result: string[]; seed: string }) => void;
  error_msg: (e: { code: string; message: string }) => void;
};
export type ClientToServerEvents = {
  create_session: (payload: z.infer<typeof CreateSessionZ>, cb?: (resp: { ok: boolean; code?: string }) => void) => void;
  join_session: (payload: z.infer<typeof JoinSessionZ>, cb?: (resp: { ok: boolean }) => void) => void;
  update_constraints: (payload: z.infer<typeof UpdateConstraintsZ>) => void;
  update_powerups: (payload: z.infer<typeof UpdatePowerUpsZ>) => void;
  spin_request: (payload: z.infer<typeof SpinReqZ>) => void;
  heartbeat: () => void;
};
