import { supabase } from '@/lib/supabase';
import { handleSupabaseError, AppError, ErrorCodes } from '@/lib/errors';
import type { DbUserSettings, SettingsUpdate } from '@/types';
import { DEFAULT_WARNING_THRESHOLD } from '@/lib/constants';

/**
 * Settings API for user settings operations.
 */
export const settingsApi = {
  /**
   * Get the current user's settings.
   * If no settings exist (shouldn't happen due to trigger), returns defaults.
   */
  async get(): Promise<DbUserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();

    if (error) {
      // If no settings found, return a default object
      // This shouldn't happen in production due to the database trigger
      if (error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new AppError(
            'Not authenticated',
            ErrorCodes.AUTH_REQUIRED,
            401
          );
        }

        // Return a client-side default (actual creation happens via DB trigger on signup)
        return {
          id: '',
          user_id: userData.user.id,
          warning_threshold: DEFAULT_WARNING_THRESHOLD,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      throw handleSupabaseError(error);
    }
    return data;
  },

  /**
   * Update the current user's settings.
   */
  async update(updates: SettingsUpdate): Promise<DbUserSettings> {
    // First, get the current user to ensure we're authenticated
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new AppError('Not authenticated', ErrorCodes.AUTH_REQUIRED, 401);
    }

    // Try to update existing settings
    const { data: existingData, error: existingError } = await supabase
      .from('user_settings')
      .select('id')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw handleSupabaseError(existingError);
    }

    if (existingData) {
      // Update existing
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', existingData.id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      if (!data) {
        throw new AppError('Settings not found', ErrorCodes.DB_NOT_FOUND, 404);
      }
      return data;
    } else {
      // Create new (shouldn't happen in normal flow)
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userData.user.id,
          warning_threshold: updates.warning_threshold ?? DEFAULT_WARNING_THRESHOLD,
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      if (!data) {
        throw new AppError('Failed to create settings', ErrorCodes.DB_ERROR, 500);
      }
      return data;
    }
  },

  /**
   * Get the warning threshold.
   * Convenience method that just returns the threshold value.
   */
  async getWarningThreshold(): Promise<number> {
    const settings = await this.get();
    return settings.warning_threshold;
  },

  /**
   * Update the warning threshold.
   * Convenience method for updating just the threshold.
   */
  async setWarningThreshold(threshold: number): Promise<DbUserSettings> {
    return this.update({ warning_threshold: threshold });
  },
};
