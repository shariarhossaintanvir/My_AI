# MY AI — Database Architecture & Schema Specification

## 1. Overview
The database tier is powered by **Supabase PostgreSQL**. Access is strictly guarded by PostgreSQL Row-Level Security (RLS). Every table requires verified user identity via Supabase Auth (`auth.uid() = user_id`). Direct anonymous reads or unauthenticated writes are rejected at the database engine level.

---

## 2. Entity-Relationship Model

```
       +--------------------+
       |     auth.users     |
       +--------------------+
                 | 1:1
                 v
       +--------------------+          1:N          +--------------------+
       |  public.profiles   | --------------------> |    usage_logs      |
       +--------------------+                       +--------------------+
                 | 1:1
                 v
       +--------------------+
       |  user_settings     |
       +--------------------+
                 | 1:N
                 v
       +--------------------+          1:N          +--------------------+
       |   conversations    | --------------------> |     messages       |
       +--------------------+                       +--------------------+
                                                              | 1:N
                                                              v
                                                    +--------------------+
                                                    |    attachments     |
                                                    +--------------------+
```

---

## 3. Table Definitions

### 3.1 `profiles`
Stores owner identity, display name, and avatar link.
- `id` (UUID, Primary Key, references `auth.users(id)` ON DELETE CASCADE)
- `email` (TEXT, Unique, Not Null)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ, Default: UTC now)
- `updated_at` (TIMESTAMPTZ, Default: UTC now)

### 3.2 `user_settings`
Personal preferences, theme, and custom instructions.
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
- `user_id` (UUID, Unique, references `auth.users(id)` ON DELETE CASCADE)
- `theme` (TEXT, Check: `dark`, `light`, `system`, Default: `system`)
- `preferred_model` (TEXT, Default: `claude-3-5-sonnet-20241022`)
- `system_instructions` (TEXT)
- `temperature` (NUMERIC(3,2), Default: 0.70)
- `max_output_tokens` (INTEGER, Default: 4096)
- `send_on_enter` (BOOLEAN, Default: true)

### 3.3 `conversations`
Chat sessions and metadata.
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
- `user_id` (UUID, Not Null, references `auth.users(id)` ON DELETE CASCADE)
- `title` (TEXT, Default: 'New Conversation')
- `is_pinned` (BOOLEAN, Default: false)
- `model` (TEXT, Default: 'claude-3-5-sonnet-20241022')
- `created_at` / `updated_at` (TIMESTAMPTZ)
- *Indexes*: `idx_conversations_user_id`, `idx_conversations_updated_at`

### 3.4 `messages`
Individual conversational turns.
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
- `conversation_id` (UUID, references `conversations(id)` ON DELETE CASCADE)
- `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `role` (TEXT, Check: `user`, `assistant`, `system`)
- `content` (TEXT, Not Null)
- `sequence_number` (INTEGER, Not Null, Default: 0)
- `model` (TEXT)
- `is_error` (BOOLEAN, Default: false)
- `error_message` (TEXT)
- *Indexes*: `idx_messages_conversation_id`, `idx_messages_sequence`

### 3.5 `attachments`
Metadata for files uploaded with prompts.
- `id` (UUID, Primary Key)
- `message_id` (UUID, references `messages(id)` ON DELETE CASCADE)
- `conversation_id` (UUID, references `conversations(id)` ON DELETE CASCADE)
- `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `file_name` (TEXT, Not Null)
- `file_type` (TEXT, `image`, `pdf`, `text`, `markdown`)
- `mime_type` (TEXT)
- `file_size_bytes` (INTEGER)

### 3.6 `usage_logs`
Fine-grained token consumption and performance tracking.
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `model` (TEXT, Not Null)
- `input_tokens` (INTEGER, Default: 0)
- `output_tokens` (INTEGER, Default: 0)
- `total_tokens` (INTEGER, Default: 0)
- `status` (TEXT, Check: `success`, `error`, `cancelled`)
- `latency_ms` (INTEGER)

---

## 4. Migration Execution
Migration files are located in `supabase/migrations/001_initial_schema.sql`.
To apply to a remote Supabase project:
```bash
# Link project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```
*Note: In accordance with Section 1 of the master prompt, executing migrations against a remote production database requires explicit user approval.*
