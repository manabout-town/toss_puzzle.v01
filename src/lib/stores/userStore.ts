import { create } from 'zustand';

interface UserSummary {
  id: string;
  nickname: string;
  isVerified: boolean;
  role: 'user' | 'admin';
}

interface UserState {
  user: UserSummary | null;
  inventory: Record<string, number>;
  setUser: (u: UserSummary | null) => void;
  setInventory: (inv: Record<string, number>) => void;
  addItem: (code: string, delta: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  inventory: {},
  setUser: (user) => set({ user }),
  setInventory: (inventory) => set({ inventory }),
  addItem: (code, delta) =>
    set((s) => ({
      inventory: { ...s.inventory, [code]: (s.inventory[code] ?? 0) + delta },
    })),
}));
