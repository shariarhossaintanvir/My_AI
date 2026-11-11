// ==========================================
// MY AI — Unified Data Repository
// Bridges Supabase & Local IndexedDB
// ==========================================

import { Conversation, Message, UserSettings, UsageLog } from '@/types';
import {
  idbGetConversations,
  idbSaveConversation,
  idbDeleteConversation,
  idbGetMessages,
  idbSaveMessage,
  idbTruncateMessagesAfter,
  idbGetSettings,
  idbSaveSettings,
  idbGetUsageLogs,
  idbAddUsageLog,
  DEFAULT_USER_SETTINGS,
} from './indexeddb';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../supabase/client';

export class StorageRepository {
  /**
   * Fetches all conversations, prioritizing Supabase if online and authenticated,
   * otherwise reading from local IndexedDB.
   */
  static async getConversations(): Promise<Conversation[]> {
    const supabase = getSupabaseBrowserClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false });

          if (!error && data) {
            const conversations: Conversation[] = data.map((c) => ({
              id: c.id,
              title: c.title,
              model: c.model,
              isPinned: c.is_pinned,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            }));

            // Sync down to local IndexedDB for instant offline access
            for (const conv of conversations) {
              await idbSaveConversation(conv);
            }

            return conversations;
          }
        }
      } catch (err) {
        console.warn('Falling back to local IndexedDB for conversations:', err);
      }
    }

    return idbGetConversations();
  }

  /**
   * Creates a new conversation and persists it.
   */
  static async createConversation(title: string, model: string = 'claude-3-5-sonnet-20241022'): Promise<Conversation> {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title,
      model,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always save locally
    await idbSaveConversation(newConv);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('conversations').insert({
            id: newConv.id,
            user_id: user.id,
            title: newConv.title,
            model: newConv.model,
            is_pinned: newConv.isPinned,
            created_at: newConv.createdAt,
            updated_at: newConv.updatedAt,
          });
        }
      } catch (err) {
        console.warn('Supabase createConversation sync error:', err);
      }
    }

    return newConv;
  }

  /**
   * Renames a conversation.
   */
  static async renameConversation(id: string, newTitle: string): Promise<void> {
    const conversations = await idbGetConversations();
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    conv.title = newTitle;
    conv.updatedAt = new Date().toISOString();

    await idbSaveConversation(conv);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase
          .from('conversations')
          .update({ title: newTitle, updated_at: conv.updatedAt })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase rename sync error:', err);
      }
    }
  }

  /**
   * Deletes a conversation and its messages.
   */
  static async deleteConversation(id: string): Promise<void> {
    await idbDeleteConversation(id);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('conversations').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete sync error:', err);
      }
    }
  }

  /**
   * Loads all messages for a specific conversation.
   */
  static async getMessages(conversationId: string): Promise<Message[]> {
    const supabase = getSupabaseBrowserClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('messages')
            .select('*, attachments(*)')
            .eq('conversation_id', conversationId)
            .order('sequence_number', { ascending: true });

          if (!error && data) {
            const messages: Message[] = data.map((m) => ({
              id: m.id,
              conversationId: m.conversation_id,
              role: m.role,
              content: m.content,
              sequenceNumber: m.sequence_number,
              model: m.model,
              isError: m.is_error,
              errorMessage: m.error_message,
              createdAt: m.created_at,
              attachments: m.attachments?.map((a: any) => ({
                id: a.id,
                name: a.file_name,
                type: a.file_type,
                mimeType: a.mime_type,
                size: a.file_size_bytes,
              })),
            }));

            // Sync to local IndexedDB
            for (const msg of messages) {
              await idbSaveMessage(msg);
            }

            return messages;
          }
        }
      } catch (err) {
        console.warn('Falling back to local IndexedDB for messages:', err);
      }
    }

    return idbGetMessages(conversationId);
  }

  /**
   * Persists a message.
   */
  static async saveMessage(message: Message): Promise<void> {
    await idbSaveMessage(message);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('messages').upsert({
            id: message.id,
            conversation_id: message.conversationId,
            user_id: user.id,
            role: message.role,
            content: message.content,
            sequence_number: message.sequenceNumber,
            model: message.model,
            is_error: message.isError || false,
            error_message: message.errorMessage,
            created_at: message.createdAt,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase saveMessage sync error:', err);
      }
    }
  }

  /**
   * Truncates messages after a specific sequence number (e.g. when editing an earlier prompt).
   */
  static async truncateMessagesAfter(conversationId: string, sequenceNumber: number): Promise<void> {
    await idbTruncateMessagesAfter(conversationId, sequenceNumber);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', conversationId)
          .gt('sequence_number', sequenceNumber);
      } catch (err) {
        console.warn('Supabase truncate sync error:', err);
      }
    }
  }

  /**
   * Gets user settings.
   */
  static async getSettings(): Promise<UserSettings> {
    return idbGetSettings();
  }

  /**
   * Saves user settings.
   */
  static async saveSettings(settings: UserSettings): Promise<void> {
    await idbSaveSettings(settings);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_settings').upsert({
            user_id: user.id,
            theme: settings.theme,
            preferred_model: settings.preferredModel,
            system_instructions: settings.systemInstructions,
            temperature: settings.temperature,
            max_output_tokens: settings.maxOutputTokens,
            send_on_enter: settings.sendOnEnter,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase saveSettings sync error:', err);
      }
    }
  }

  /**
   * Retrieves usage logs.
   */
  static async getUsageLogs(): Promise<UsageLog[]> {
    return idbGetUsageLogs();
  }

  /**
   * Records a token usage entry.
   */
  static async recordUsage(log: UsageLog): Promise<void> {
    await idbAddUsageLog(log);

    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('usage_logs').insert({
            id: log.id,
            user_id: user.id,
            conversation_id: log.conversationId,
            model: log.model,
            input_tokens: log.inputTokens,
            output_tokens: log.outputTokens,
            total_tokens: log.totalTokens,
            status: log.status,
            latency_ms: log.latencyMs,
            created_at: log.createdAt,
          });
        }
      } catch (err) {
        console.warn('Supabase recordUsage sync error:', err);
      }
    }
  }
}
