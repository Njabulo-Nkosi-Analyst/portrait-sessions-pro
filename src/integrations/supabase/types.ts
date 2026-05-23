export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_blocks: {
        Row: {
          block_date: string
          created_at: string
          end_time: string | null
          id: string
          is_available: boolean
          note: string | null
          start_time: string | null
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          note?: string | null
          start_time?: string | null
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          note?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      booking_expenses: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          km: number | null
          label: string | null
          rate_per_km: number | null
          type: string
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          id?: string
          km?: number | null
          label?: string | null
          rate_per_km?: number | null
          type: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          km?: number | null
          label?: string | null
          rate_per_km?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_expenses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          category: string | null
          client_email: string | null
          client_name: string
          client_whatsapp: string | null
          confirmed_at: string
          created_at: string
          discount_amount: number
          discount_reason: string | null
          final_price: number
          id: string
          inquiry_id: string | null
          notes: string | null
          package_name: string | null
          package_price: number
          session_date: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          client_email?: string | null
          client_name: string
          client_whatsapp?: string | null
          confirmed_at?: string
          created_at?: string
          discount_amount?: number
          discount_reason?: string | null
          final_price?: number
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          package_name?: string | null
          package_price?: number
          session_date?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          client_email?: string | null
          client_name?: string
          client_whatsapp?: string | null
          confirmed_at?: string
          created_at?: string
          discount_amount?: number
          discount_reason?: string | null
          final_price?: number
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          package_name?: string | null
          package_price?: number
          session_date?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      client_gallery_access: {
        Row: {
          booking_id: string | null
          client_name: string
          cover_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          title: string | null
          token: string
        }
        Insert: {
          booking_id?: string | null
          client_name: string
          cover_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          title?: string | null
          token: string
        }
        Update: {
          booking_id?: string | null
          client_name?: string
          cover_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          title?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_gallery_access_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      client_gallery_images: {
        Row: {
          caption: string | null
          created_at: string
          gallery_id: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          gallery_id: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          gallery_id?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_gallery_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "client_gallery_access"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          id: string
          is_featured: boolean
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string
          id?: string
          is_featured?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      hero_images: {
        Row: {
          category_label: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          url: string
          video_url: string | null
        }
        Insert: {
          category_label: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          url: string
          video_url?: string | null
        }
        Update: {
          category_label?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          category: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          package_interest: string | null
          preferred_date: string | null
          status: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          package_interest?: string | null
          preferred_date?: string | null
          status?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          package_interest?: string | null
          preferred_date?: string | null
          status?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind: string
          link?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          duration: string
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price: number
          sort_order: number
          video_url: string | null
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string
          duration: string
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price: number
          sort_order?: number
          video_url?: string | null
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          duration?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price?: number
          sort_order?: number
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_label: string | null
          ends_at: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_label?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_label?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          category: string
          created_at: string
          email: string
          estimated_price: number
          extras: Json
          hours: number
          id: string
          location: string | null
          name: string
          whatsapp: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          estimated_price?: number
          extras?: Json
          hours?: number
          id?: string
          location?: string | null
          name: string
          whatsapp?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          estimated_price?: number
          extras?: Json
          hours?: number
          id?: string
          location?: string | null
          name?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_name: string
          created_at: string
          gallery_id: string | null
          id: string
          is_published: boolean
          quote: string
          rating: number
        }
        Insert: {
          booking_id?: string | null
          client_name: string
          created_at?: string
          gallery_id?: string | null
          id?: string
          is_published?: boolean
          quote: string
          rating?: number
        }
        Update: {
          booking_id?: string | null
          client_name?: string
          created_at?: string
          gallery_id?: string | null
          id?: string
          is_published?: boolean
          quote?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "client_gallery_access"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          category: string | null
          client_name: string
          created_at: string
          id: string
          quote: string
          rating: number
        }
        Insert: {
          category?: string | null
          client_name: string
          created_at?: string
          id?: string
          quote: string
          rating?: number
        }
        Update: {
          category?: string | null
          client_name?: string
          created_at?: string
          id?: string
          quote?: string
          rating?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
