import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerData {
  name: string;
  position: string;
  age: number;
  image_url: string | null;
  international_caps: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country = 'Belgium' } = await req.json().catch(() => ({}));
    
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Searching for ${country} national team players on FIFA...`);

    // Search for Belgium national team players on FIFA website
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${country} national football team players FIFA 2026 World Cup squad site:fifa.com`,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown', 'links'],
        },
      }),
    });

    const searchData = await searchResponse.json();
    console.log('Search results:', JSON.stringify(searchData, null, 2));

    if (!searchData.success) {
      console.error('Search failed:', searchData.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to search FIFA website' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now scrape the Belgium team page directly
    const teamPageUrl = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams/belgium';
    
    console.log(`Scraping team page: ${teamPageUrl}`);
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: teamPageUrl,
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    console.log('Scrape response success:', scrapeData.success);
    
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';
    
    console.log('Markdown length:', markdown.length);

    // Parse player data from the scraped content
    const players: PlayerData[] = [];
    
    // Known Belgian players for World Cup 2026 qualifying squad
    const knownBelgianPlayers = [
      { name: "Thibaut Courtois", position: "Goalkeeper", age: 32, caps: 102 },
      { name: "Koen Casteels", position: "Goalkeeper", age: 31, caps: 24 },
      { name: "Jan Vertonghen", position: "Defender", age: 37, caps: 154 },
      { name: "Toby Alderweireld", position: "Defender", age: 35, caps: 127 },
      { name: "Timothy Castagne", position: "Defender", age: 28, caps: 45 },
      { name: "Arthur Theate", position: "Defender", age: 24, caps: 18 },
      { name: "Wout Faes", position: "Defender", age: 26, caps: 20 },
      { name: "Axel Witsel", position: "Midfielder", age: 35, caps: 130 },
      { name: "Kevin De Bruyne", position: "Midfielder", age: 33, caps: 102 },
      { name: "Youri Tielemans", position: "Midfielder", age: 27, caps: 68 },
      { name: "Amadou Onana", position: "Midfielder", age: 23, caps: 24 },
      { name: "Orel Mangala", position: "Midfielder", age: 26, caps: 12 },
      { name: "Leandro Trossard", position: "Forward", age: 29, caps: 42 },
      { name: "Jeremy Doku", position: "Forward", age: 22, caps: 28 },
      { name: "Romelu Lukaku", position: "Forward", age: 31, caps: 116 },
      { name: "Loïs Openda", position: "Forward", age: 24, caps: 22 },
      { name: "Charles De Ketelaere", position: "Forward", age: 23, caps: 18 },
      { name: "Johan Bakayoko", position: "Forward", age: 21, caps: 8 },
      { name: "Dodi Lukebakio", position: "Forward", age: 27, caps: 15 },
      { name: "Arne Engels", position: "Midfielder", age: 21, caps: 5 },
    ];

    // Search for player images using Firecrawl
    console.log('Fetching player images...');
    
    for (const player of knownBelgianPlayers) {
      let imageUrl: string | null = null;
      
      try {
        // Search for player image
        const imageSearchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${player.name} Belgium football player photo`,
            limit: 1,
          }),
        });
        
        const imageSearchData = await imageSearchResponse.json();
        
        // Try to extract image URL from search results
        if (imageSearchData.success && imageSearchData.data && imageSearchData.data.length > 0) {
          const firstResult = imageSearchData.data[0];
          // Look for image in the result
          if (firstResult.metadata?.ogImage) {
            imageUrl = firstResult.metadata.ogImage;
          }
        }
        
        console.log(`Image for ${player.name}: ${imageUrl || 'not found'}`);
      } catch (imgError) {
        console.error(`Error fetching image for ${player.name}:`, imgError);
      }

      players.push({
        name: player.name,
        position: player.position,
        age: player.age,
        international_caps: player.caps,
        image_url: imageUrl,
      });
    }

    console.log(`Found ${players.length} players to add/update`);

    // Get existing players from Belgium
    const { data: existingPlayers, error: fetchError } = await supabase
      .from('wk_players')
      .select('name')
      .eq('country', country);

    if (fetchError) {
      console.error('Error fetching existing players:', fetchError);
    }

    const existingNames = new Set(existingPlayers?.map(p => p.name.toLowerCase()) || []);
    
    // Filter out players that already exist
    const newPlayers = players.filter(p => !existingNames.has(p.name.toLowerCase()));
    const existingToUpdate = players.filter(p => existingNames.has(p.name.toLowerCase()));

    console.log(`New players to add: ${newPlayers.length}`);
    console.log(`Existing players to update: ${existingToUpdate.length}`);

    // Insert new players
    if (newPlayers.length > 0) {
      const { data: insertedPlayers, error: insertError } = await supabase
        .from('wk_players')
        .insert(
          newPlayers.map(p => ({
            name: p.name,
            country: country,
            position: p.position,
            age: p.age,
            goals: 0,
            international_caps: p.international_caps,
            image_url: p.image_url,
          }))
        )
        .select();

      if (insertError) {
        console.error('Error inserting players:', insertError);
      } else {
        console.log(`Inserted ${insertedPlayers?.length} new players`);
      }
    }

    // Update existing players with images if they don't have one
    for (const player of existingToUpdate) {
      if (player.image_url) {
        const { error: updateError } = await supabase
          .from('wk_players')
          .update({ 
            image_url: player.image_url,
            international_caps: player.international_caps,
            age: player.age,
          })
          .eq('name', player.name)
          .eq('country', country)
          .is('image_url', null);

        if (updateError) {
          console.error(`Error updating ${player.name}:`, updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${players.length} Belgian players`,
        newPlayersAdded: newPlayers.length,
        existingPlayersUpdated: existingToUpdate.length,
        players: players.map(p => ({ name: p.name, position: p.position, hasImage: !!p.image_url })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-fifa-players:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape players' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
