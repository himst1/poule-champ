import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  name: string;
  country: string;
}

interface PlayerImageResult {
  id: string;
  name: string;
  image_url: string | null;
  error?: string;
}

interface FetchPlayerImagesResponse {
  success: boolean;
  results?: PlayerImageResult[];
  summary?: {
    total: number;
    found: number;
    notFound: number;
  };
  error?: string;
}

/**
 * Fetch player images using the edge function
 */
export const fetchPlayerImages = async (players: Player[]): Promise<FetchPlayerImagesResponse> => {
  const { data, error } = await supabase.functions.invoke('fetch-player-images', {
    body: { players },
  });

  if (error) {
    console.error('Error calling fetch-player-images:', error);
    return { success: false, error: error.message };
  }

  return data;
};

/**
 * Update player image URLs in the database
 */
export const updatePlayerImages = async (
  results: PlayerImageResult[]
): Promise<{ success: boolean; updated: number; errors: string[] }> => {
  const errors: string[] = [];
  let updated = 0;

  for (const result of results) {
    if (result.image_url) {
      const { error } = await supabase
        .from('wk_players')
        .update({ image_url: result.image_url })
        .eq('id', result.id);

      if (error) {
        console.error(`Error updating image for ${result.name}:`, error);
        errors.push(`${result.name}: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  return { success: errors.length === 0, updated, errors };
};

/**
 * Fetch and update player images in one operation
 */
export const fetchAndUpdatePlayerImages = async (
  players: Player[]
): Promise<{
  success: boolean;
  fetched: number;
  updated: number;
  errors: string[];
}> => {
  // First, fetch the images
  const fetchResult = await fetchPlayerImages(players);

  if (!fetchResult.success || !fetchResult.results) {
    return {
      success: false,
      fetched: 0,
      updated: 0,
      errors: [fetchResult.error || 'Failed to fetch images'],
    };
  }

  // Then, update the database
  const updateResult = await updatePlayerImages(fetchResult.results);

  return {
    success: updateResult.success,
    fetched: fetchResult.summary?.found || 0,
    updated: updateResult.updated,
    errors: updateResult.errors,
  };
};
