const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerImageRequest {
  players: Array<{
    id: string;
    name: string;
    country: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY_1') || Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured (checked FIRECRAWL_API_KEY_1 and FIRECRAWL_API_KEY)');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { players }: PlayerImageRequest = await req.json();

    if (!players || !Array.isArray(players) || players.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Players array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching images for ${players.length} players`);

    const results: Array<{ id: string; name: string; image_url: string | null; error?: string }> = [];

    // Process players sequentially to avoid rate limiting
    for (const player of players) {
      try {
        console.log(`Searching for: ${player.name} (${player.country})`);
        
        // Search directly on Transfermarkt for high-quality player photos
        const searchQuery = `site:transfermarkt.com ${player.name} ${player.country}`;
        
        console.log(`Searching Transfermarkt for: ${player.name}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 3,
            scrapeOptions: {
              formats: ['markdown', 'html'],
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Firecrawl API error for ${player.name}:`, data);
          results.push({
            id: player.id,
            name: player.name,
            image_url: null,
            error: data.error || `Request failed with status ${response.status}`,
          });
          continue;
        }

        // Try to find Transfermarkt image URL from search results
        let imageUrl: string | null = null;
        
        if (data.data && Array.isArray(data.data)) {
          for (const result of data.data) {
            // Check for Transfermarkt specific image patterns
            const ogImage = result.metadata?.ogImage;
            const image = result.metadata?.image;
            
            // Prefer img.transfermarkt.com URLs
            if (ogImage && ogImage.includes('img.transfermarkt.com')) {
              imageUrl = ogImage;
              console.log(`Found Transfermarkt image: ${imageUrl}`);
              break;
            }
            if (image && image.includes('img.transfermarkt.com')) {
              imageUrl = image;
              console.log(`Found Transfermarkt image: ${imageUrl}`);
              break;
            }
            
            // Also check in HTML content for image URLs
            if (result.html) {
              const tmImageMatch = result.html.match(/https:\/\/img\.transfermarkt\.com\/[^"'\s]+/);
              if (tmImageMatch) {
                imageUrl = tmImageMatch[0];
                console.log(`Extracted Transfermarkt image from HTML: ${imageUrl}`);
                break;
              }
            }
            
            // Fallback to any ogImage or image
            if (!imageUrl && ogImage) {
              imageUrl = ogImage;
            }
            if (!imageUrl && image) {
              imageUrl = image;
            }
          }
        }

        // If no Transfermarkt image found, try FIFA search as fallback
        if (!imageUrl) {
          console.log(`No Transfermarkt image found for ${player.name}, trying FIFA...`);
          
          const fifaQuery = `site:fifa.com ${player.name} ${player.country} player`;
          
          const fifaResponse = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: fifaQuery,
              limit: 2,
              scrapeOptions: {
                formats: ['markdown'],
              },
            }),
          });

          const fifaData = await fifaResponse.json();
          
          if (fifaResponse.ok && fifaData.data) {
            for (const result of fifaData.data) {
              if (result.metadata?.ogImage) {
                imageUrl = result.metadata.ogImage;
                console.log(`Found FIFA image for ${player.name}: ${imageUrl}`);
                break;
              }
              if (result.metadata?.image) {
                imageUrl = result.metadata.image;
                break;
              }
            }
          }
        }

        console.log(`Found image for ${player.name}: ${imageUrl || 'none'}`);
        
        results.push({
          id: player.id,
          name: player.name,
          image_url: imageUrl,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error fetching image for ${player.name}:`, error);
        results.push({
          id: player.id,
          name: player.name,
          image_url: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.image_url).length;
    console.log(`Successfully found images for ${successCount}/${players.length} players`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          total: players.length,
          found: successCount,
          notFound: players.length - successCount,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-player-images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
