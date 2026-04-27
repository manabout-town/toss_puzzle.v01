// 본 파일은 Supabase CLI가 자동 생성합니다.
//   pnpm supabase:types
// 위 명령으로 supabase/migrations 의 스키마로부터 타입을 다시 만드세요.
// 아래 골격은 자동 생성 전에 import 오류를 피하기 위한 임시 정의입니다.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          is_verified: boolean;
          is_blocked: boolean;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      stages: {
        Row: {
          id: number;
          chapter: number;
          order_in_chapter: number;
          title: string;
          goal: Record<string, unknown>;
          board_config: Record<string, unknown>;
          time_limit_sec: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['stages']['Row']>;
        Update: Partial<Database['public']['Tables']['stages']['Row']>;
        Relationships: [];
      };
      user_progress: {
        Row: {
          user_id: string;
          stage_id: number;
          best_score: number;
          stars: number;
          cleared_at: string | null;
          attempts: number;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_progress']['Row']>;
        Update: Partial<Database['public']['Tables']['user_progress']['Row']>;
        Relationships: [];
      };
      inventory: {
        Row: {
          user_id: string;
          item_code: string;
          quantity: number;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['inventory']['Row']>;
        Update: Partial<Database['public']['Tables']['inventory']['Row']>;
        Relationships: [];
      };
      gacha_history: {
        Row: {
          id: number;
          user_id: string;
          pool: 'standard' | 'premium';
          result_item_code: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          cost_item_code: string;
          cost_amount: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['gacha_history']['Row']>;
        Update: Partial<Database['public']['Tables']['gacha_history']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
