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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_email_verifications: {
        Row: {
          attempts: number
          code_hash: string
          course_slug: string
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_hash: string
          plan: string
          session_hash: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          course_slug: string
          created_at?: string
          email: string
          expires_at?: string
          id: string
          ip_hash: string
          plan: string
          session_hash: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          course_slug?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_hash?: string
          plan?: string
          session_hash?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      course_capstone_items: {
        Row: {
          course_id: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          description: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_capstone_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lecturers: {
        Row: {
          course_id: string
          created_at: string
          id: string
          image_alt: string | null
          image_url: string | null
          is_published: boolean
          linkedin_url: string | null
          name: string
          role: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_published?: boolean
          linkedin_url?: string | null
          name: string
          role: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_published?: boolean
          linkedin_url?: string | null
          name?: string
          role?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lecturers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          description: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_outcomes: {
        Row: {
          course_id: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          description: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_outcomes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_overview_items: {
        Row: {
          course_id: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          description: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_overview_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_payment_attempts: {
        Row: {
          amount: number
          checkout_expires_at: number | null
          created_at: string
          currency: string
          id: string
          order_id: string
          paid_at: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          checkout_expires_at?: number | null
          created_at?: string
          currency?: string
          id: string
          order_id: string
          paid_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          checkout_expires_at?: number | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      course_plans: {
        Row: {
          amount: number
          course_id: string
          description: string | null
          features: string[]
          id: string
          is_active: boolean
          manual_payments_enabled: boolean
          minimum_payment: number
          sort_order: number
          stripe_price_id: string | null
          title: string
        }
        Insert: {
          amount: number
          course_id: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          manual_payments_enabled?: boolean
          minimum_payment?: number
          sort_order?: number
          stripe_price_id?: string | null
          title: string
        }
        Update: {
          amount?: number
          course_id?: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          manual_payments_enabled?: boolean
          minimum_payment?: number
          sort_order?: number
          stripe_price_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_plans_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_stats: {
        Row: {
          course_id: string
          id: string
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          course_id: string
          id?: string
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          course_id?: string
          id?: string
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_stats_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          audience_summary: string | null
          benefits: string | null
          capstone_body: string | null
          capstone_title: string | null
          card_description: string
          created_at: string
          curriculum_body: string | null
          curriculum_title: string | null
          curriculum_tools: string[]
          enrollment_closes_on: string | null
          enrollment_open: boolean
          enrollment_opens_on: string | null
          id: string
          introduction: string | null
          is_curriculum_course: boolean
          is_popular: boolean
          is_published: boolean
          outcomes_title: string | null
          overview_body: string | null
          overview_title: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          starts_on: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience_summary?: string | null
          benefits?: string | null
          capstone_body?: string | null
          capstone_title?: string | null
          card_description: string
          created_at?: string
          curriculum_body?: string | null
          curriculum_title?: string | null
          curriculum_tools?: string[]
          enrollment_closes_on?: string | null
          enrollment_open?: boolean
          enrollment_opens_on?: string | null
          id?: string
          introduction?: string | null
          is_curriculum_course?: boolean
          is_popular?: boolean
          is_published?: boolean
          outcomes_title?: string | null
          overview_body?: string | null
          overview_title?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          starts_on?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience_summary?: string | null
          benefits?: string | null
          capstone_body?: string | null
          capstone_title?: string | null
          card_description?: string
          created_at?: string
          curriculum_body?: string | null
          curriculum_title?: string | null
          curriculum_tools?: string[]
          enrollment_closes_on?: string | null
          enrollment_open?: boolean
          enrollment_opens_on?: string | null
          id?: string
          introduction?: string | null
          is_curriculum_course?: boolean
          is_popular?: boolean
          is_published?: boolean
          outcomes_title?: string | null
          overview_body?: string | null
          overview_title?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          starts_on?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          stripe_customer_id: string | null
          stripe_test_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_test_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_test_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_agenda_items: {
        Row: {
          description: string | null
          event_id: string
          id: string
          starts_at: string
          title: string
        }
        Insert: {
          description?: string | null
          event_id: string
          id?: string
          starts_at: string
          title: string
        }
        Update: {
          description?: string | null
          event_id?: string
          id?: string
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_highlights: {
        Row: {
          event_id: string
          icon: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          event_id: string
          icon: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          icon?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_highlights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          company: string | null
          event_id: string
          id: string
          job_title: string | null
          name: string
          photo_alt: string | null
          photo_url: string | null
          sort_order: number
        }
        Insert: {
          company?: string | null
          event_id: string
          id?: string
          job_title?: string | null
          name: string
          photo_alt?: string | null
          photo_url?: string | null
          sort_order?: number
        }
        Update: {
          company?: string | null
          event_id?: string
          id?: string
          job_title?: string | null
          name?: string
          photo_alt?: string | null
          photo_url?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address_country: string | null
          address_locality: string | null
          agenda_title: string
          card_description: string
          created_at: string
          ends_at: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          introduction: string
          is_published: boolean
          location: string
          price: number
          registration_closes_on: string | null
          registration_open: boolean
          registration_opens_on: string | null
          slug: string
          sort_order: number
          starts_at: string
          street_address: string | null
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          address_country?: string | null
          address_locality?: string | null
          agenda_title: string
          card_description: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          introduction: string
          is_published?: boolean
          location: string
          price: number
          registration_closes_on?: string | null
          registration_open?: boolean
          registration_opens_on?: string | null
          slug: string
          sort_order?: number
          starts_at: string
          street_address?: string | null
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          address_country?: string | null
          address_locality?: string | null
          agenda_title?: string
          card_description?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          introduction?: string
          is_published?: boolean
          location?: string
          price?: number
          registration_closes_on?: string | null
          registration_open?: boolean
          registration_opens_on?: string | null
          slug?: string
          sort_order?: number
          starts_at?: string
          street_address?: string | null
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      graduates: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_emails: {
        Row: {
          attempts: number
          created_at: string
          first_attempt_at: string | null
          id: string
          last_error: string | null
          lease_token: string | null
          locked_until: string | null
          next_attempt_at: string
          order_id: string
          payload: Json
          provider_id: string | null
          recipient: string
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          first_attempt_at?: string | null
          id: string
          last_error?: string | null
          lease_token?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          order_id: string
          payload: Json
          provider_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          last_error?: string | null
          lease_token?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          order_id?: string
          payload?: Json
          provider_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_emails_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          activity_at: string | null
          amount: number
          amount_paid: number
          checkout_email: string | null
          checkout_verification_id: string | null
          course_email_snapshot: Json | null
          course_id: string | null
          created_at: string
          currency: string
          customer_id: string
          event_id: string | null
          first_paid_at: string | null
          id: string
          last_paid_at: string | null
          minimum_payment: number | null
          paid_at: string | null
          payment_mode: string
          plan_id: string | null
          refunded_amount: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_livemode: boolean
          stripe_payment_intent_id: string | null
          successful_payment_count: number
          updated_at: string
        }
        Insert: {
          activity_at?: never
          amount: number
          amount_paid?: number
          checkout_email?: string | null
          checkout_verification_id?: string | null
          course_email_snapshot?: Json | null
          course_id?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          event_id?: string | null
          first_paid_at?: string | null
          id?: string
          last_paid_at?: string | null
          minimum_payment?: number | null
          paid_at?: string | null
          payment_mode?: string
          plan_id?: string | null
          refunded_amount?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_livemode?: boolean
          stripe_payment_intent_id?: string | null
          successful_payment_count?: number
          updated_at?: string
        }
        Update: {
          activity_at?: never
          amount?: number
          amount_paid?: number
          checkout_email?: string | null
          checkout_verification_id?: string | null
          course_email_snapshot?: Json | null
          course_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          event_id?: string | null
          first_paid_at?: string | null
          id?: string
          last_paid_at?: string | null
          minimum_payment?: number | null
          paid_at?: string | null
          payment_mode?: string
          plan_id?: string | null
          refunded_amount?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_livemode?: boolean
          stripe_payment_intent_id?: string | null
          successful_payment_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_checkout_verification_id_fkey"
            columns: ["checkout_verification_id"]
            isOneToOne: true
            referencedRelation: "checkout_email_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "course_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_deliverables: {
        Row: {
          description: string
          id: string
          service_id: string
          sort_order: number
          title: string
        }
        Insert: {
          description: string
          id?: string
          service_id: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          service_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_deliverables_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_limits: {
        Row: {
          created_at: string
          email_hash: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          email_hash: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          email_hash?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      service_scope_items: {
        Row: {
          description: string
          id: string
          service_id: string
          sort_order: number
          title: string
        }
        Insert: {
          description: string
          id?: string
          service_id: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          service_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_scope_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_use_cases: {
        Row: {
          description: string
          id: string
          service_id: string
          sort_order: number
          title: string
        }
        Insert: {
          description: string
          id?: string
          service_id: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          service_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_use_cases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          card_description: string
          created_at: string
          deliverables_title: string
          id: string
          introduction: string | null
          is_published: boolean
          scope_title: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
          use_cases_title: string
        }
        Insert: {
          card_description: string
          created_at?: string
          deliverables_title?: string
          id?: string
          introduction?: string | null
          is_published?: boolean
          scope_title?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          use_cases_title?: string
        }
        Update: {
          card_description?: string
          created_at?: string
          deliverables_title?: string
          id?: string
          introduction?: string | null
          is_published?: boolean
          scope_title?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          use_cases_title?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          image_alt: string | null
          image_url: string | null
          is_published: boolean
          linkedin_url: string | null
          name: string
          organization: string | null
          role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_published?: boolean
          linkedin_url?: string | null
          name: string
          organization?: string | null
          role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_published?: boolean
          linkedin_url?: string | null
          name?: string
          organization?: string | null
          role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          academy_sort_order: number
          avatar_url: string | null
          company: string | null
          context_label: string | null
          course_id: string | null
          created_at: string
          home_sort_order: number
          id: string
          is_published: boolean
          job_title: string | null
          name: string
          quote: string
          service_slug: string | null
          show_on_academy: boolean
          show_on_home: boolean
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          academy_sort_order?: number
          avatar_url?: string | null
          company?: string | null
          context_label?: string | null
          course_id?: string | null
          created_at?: string
          home_sort_order?: number
          id?: string
          is_published?: boolean
          job_title?: string | null
          name: string
          quote: string
          service_slug?: string | null
          show_on_academy?: boolean
          show_on_home?: boolean
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          academy_sort_order?: number
          avatar_url?: string | null
          company?: string | null
          context_label?: string | null
          course_id?: string | null
          created_at?: string
          home_sort_order?: number
          id?: string
          is_published?: boolean
          job_title?: string | null
          name?: string
          quote?: string
          service_slug?: string | null
          show_on_academy?: boolean
          show_on_home?: boolean
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_service_slug_fkey"
            columns: ["service_slug"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_order_email: {
        Args: never
        Returns: {
          attempts: number
          created_at: string
          first_attempt_at: string | null
          id: string
          last_error: string | null
          lease_token: string | null
          locked_until: string | null
          next_attempt_at: string
          order_id: string
          payload: Json
          provider_id: string | null
          recipient: string
          sent_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "order_emails"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      expire_course_payment: {
        Args: { p_attempt: string; p_session: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_valid_timezone: { Args: { tz: string }; Returns: boolean }
      prepare_course_payment_v2: {
        Args: {
          p_amount: number
          p_livemode?: boolean
          p_name: string
          p_new_purchase: boolean
          p_phone: string
          p_session_hash: string
          p_snapshot: Json
          p_verification: string
        }
        Returns: {
          amount: number
          checkout_expires_at: number | null
          created_at: string
          currency: string
          id: string
          order_id: string
          paid_at: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "course_payment_attempts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      record_course_payment: {
        Args: {
          p_amount: number
          p_attempt: string
          p_currency: string
          p_intent: string
          p_paid_at: string
          p_session: string
        }
        Returns: undefined
      }
      request_checkout_email_code: {
        Args: {
          p_code_hash: string
          p_course: string
          p_email: string
          p_id: string
          p_ip_hash: string
          p_plan: string
          p_session_hash: string
        }
        Returns: boolean
      }
      reserve_service_request: {
        Args: { p_email_hash: string; p_ip_hash: string }
        Returns: boolean
      }
      verify_checkout_email_code: {
        Args: { p_code_hash: string; p_id: string; p_session_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
