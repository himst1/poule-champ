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

// Player data for different countries
const countryPlayers: Record<string, { name: string; position: string; age: number; caps: number }[]> = {
  'Belgium': [
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
  ],
  'Nederland': [
    { name: "Bart Verbruggen", position: "Goalkeeper", age: 22, caps: 12 },
    { name: "Justin Bijlow", position: "Goalkeeper", age: 26, caps: 5 },
    { name: "Virgil van Dijk", position: "Defender", age: 33, caps: 68 },
    { name: "Nathan Aké", position: "Defender", age: 29, caps: 55 },
    { name: "Matthijs de Ligt", position: "Defender", age: 25, caps: 48 },
    { name: "Denzel Dumfries", position: "Defender", age: 28, caps: 52 },
    { name: "Jurriën Timber", position: "Defender", age: 23, caps: 22 },
    { name: "Micky van de Ven", position: "Defender", age: 23, caps: 10 },
    { name: "Frenkie de Jong", position: "Midfielder", age: 27, caps: 58 },
    { name: "Tijjani Reijnders", position: "Midfielder", age: 26, caps: 18 },
    { name: "Ryan Gravenberch", position: "Midfielder", age: 22, caps: 18 },
    { name: "Teun Koopmeiners", position: "Midfielder", age: 26, caps: 22 },
    { name: "Xavi Simons", position: "Midfielder", age: 21, caps: 20 },
    { name: "Jerdy Schouten", position: "Midfielder", age: 27, caps: 15 },
    { name: "Memphis Depay", position: "Forward", age: 30, caps: 98 },
    { name: "Cody Gakpo", position: "Forward", age: 25, caps: 38 },
    { name: "Donyell Malen", position: "Forward", age: 25, caps: 35 },
    { name: "Steven Bergwijn", position: "Forward", age: 27, caps: 35 },
    { name: "Wout Weghorst", position: "Forward", age: 32, caps: 35 },
    { name: "Brian Brobbey", position: "Forward", age: 22, caps: 8 },
    { name: "Joshua Zirkzee", position: "Forward", age: 23, caps: 5 },
  ],
  'Duitsland': [
    { name: "Manuel Neuer", position: "Goalkeeper", age: 38, caps: 121 },
    { name: "Marc-André ter Stegen", position: "Goalkeeper", age: 32, caps: 42 },
    { name: "Antonio Rüdiger", position: "Defender", age: 31, caps: 70 },
    { name: "Jonathan Tah", position: "Defender", age: 28, caps: 32 },
    { name: "Nico Schlotterbeck", position: "Defender", age: 25, caps: 18 },
    { name: "David Raum", position: "Defender", age: 26, caps: 24 },
    { name: "Benjamin Henrichs", position: "Defender", age: 27, caps: 20 },
    { name: "Joshua Kimmich", position: "Midfielder", age: 29, caps: 95 },
    { name: "İlkay Gündoğan", position: "Midfielder", age: 34, caps: 82 },
    { name: "Toni Kroos", position: "Midfielder", age: 34, caps: 114 },
    { name: "Jamal Musiala", position: "Midfielder", age: 21, caps: 38 },
    { name: "Florian Wirtz", position: "Midfielder", age: 21, caps: 28 },
    { name: "Robert Andrich", position: "Midfielder", age: 30, caps: 15 },
    { name: "Leroy Sané", position: "Forward", age: 28, caps: 67 },
    { name: "Serge Gnabry", position: "Forward", age: 29, caps: 48 },
    { name: "Kai Havertz", position: "Forward", age: 25, caps: 52 },
    { name: "Niclas Füllkrug", position: "Forward", age: 31, caps: 20 },
    { name: "Deniz Undav", position: "Forward", age: 28, caps: 8 },
    { name: "Maximilian Beier", position: "Forward", age: 21, caps: 5 },
  ],
  'Frankrijk': [
    { name: "Mike Maignan", position: "Goalkeeper", age: 29, caps: 18 },
    { name: "Alphonse Areola", position: "Goalkeeper", age: 31, caps: 8 },
    { name: "Dayot Upamecano", position: "Defender", age: 26, caps: 28 },
    { name: "William Saliba", position: "Defender", age: 23, caps: 18 },
    { name: "Theo Hernández", position: "Defender", age: 27, caps: 38 },
    { name: "Jules Koundé", position: "Defender", age: 25, caps: 32 },
    { name: "Ibrahima Konaté", position: "Defender", age: 25, caps: 15 },
    { name: "Aurélien Tchouaméni", position: "Midfielder", age: 24, caps: 38 },
    { name: "Eduardo Camavinga", position: "Midfielder", age: 21, caps: 22 },
    { name: "N'Golo Kanté", position: "Midfielder", age: 33, caps: 58 },
    { name: "Antoine Griezmann", position: "Forward", age: 33, caps: 130 },
    { name: "Kylian Mbappé", position: "Forward", age: 26, caps: 82 },
    { name: "Ousmane Dembélé", position: "Forward", age: 27, caps: 48 },
    { name: "Marcus Thuram", position: "Forward", age: 27, caps: 25 },
    { name: "Randal Kolo Muani", position: "Forward", age: 26, caps: 22 },
    { name: "Olivier Giroud", position: "Forward", age: 38, caps: 137 },
    { name: "Kingsley Coman", position: "Forward", age: 28, caps: 58 },
    { name: "Bradley Barcola", position: "Forward", age: 22, caps: 8 },
  ],
  'Spanje': [
    { name: "Unai Simón", position: "Goalkeeper", age: 27, caps: 42 },
    { name: "David Raya", position: "Goalkeeper", age: 29, caps: 5 },
    { name: "Aymeric Laporte", position: "Defender", age: 30, caps: 48 },
    { name: "Dani Carvajal", position: "Defender", age: 32, caps: 52 },
    { name: "Marc Cucurella", position: "Defender", age: 26, caps: 18 },
    { name: "Robin Le Normand", position: "Defender", age: 27, caps: 12 },
    { name: "Alejandro Grimaldo", position: "Defender", age: 29, caps: 8 },
    { name: "Rodri", position: "Midfielder", age: 28, caps: 62 },
    { name: "Pedri", position: "Midfielder", age: 22, caps: 32 },
    { name: "Gavi", position: "Midfielder", age: 20, caps: 28 },
    { name: "Fabián Ruiz", position: "Midfielder", age: 28, caps: 38 },
    { name: "Dani Olmo", position: "Midfielder", age: 26, caps: 42 },
    { name: "Lamine Yamal", position: "Forward", age: 17, caps: 18 },
    { name: "Nico Williams", position: "Forward", age: 22, caps: 22 },
    { name: "Álvaro Morata", position: "Forward", age: 32, caps: 80 },
    { name: "Ferran Torres", position: "Forward", age: 24, caps: 48 },
    { name: "Mikel Oyarzabal", position: "Forward", age: 27, caps: 35 },
  ],
  'Engeland': [
    { name: "Jordan Pickford", position: "Goalkeeper", age: 30, caps: 62 },
    { name: "Aaron Ramsdale", position: "Goalkeeper", age: 26, caps: 5 },
    { name: "Harry Maguire", position: "Defender", age: 31, caps: 65 },
    { name: "John Stones", position: "Defender", age: 30, caps: 75 },
    { name: "Kyle Walker", position: "Defender", age: 34, caps: 92 },
    { name: "Kieran Trippier", position: "Defender", age: 34, caps: 54 },
    { name: "Luke Shaw", position: "Defender", age: 29, caps: 35 },
    { name: "Marc Guéhi", position: "Defender", age: 24, caps: 18 },
    { name: "Declan Rice", position: "Midfielder", age: 25, caps: 58 },
    { name: "Jude Bellingham", position: "Midfielder", age: 21, caps: 38 },
    { name: "Kobbie Mainoo", position: "Midfielder", age: 19, caps: 8 },
    { name: "Cole Palmer", position: "Midfielder", age: 22, caps: 15 },
    { name: "Phil Foden", position: "Forward", age: 24, caps: 42 },
    { name: "Bukayo Saka", position: "Forward", age: 23, caps: 42 },
    { name: "Harry Kane", position: "Forward", age: 31, caps: 98 },
    { name: "Marcus Rashford", position: "Forward", age: 27, caps: 60 },
    { name: "Anthony Gordon", position: "Forward", age: 23, caps: 8 },
    { name: "Ollie Watkins", position: "Forward", age: 28, caps: 18 },
    { name: "Ivan Toney", position: "Forward", age: 28, caps: 12 },
  ],
  'Portugal': [
    { name: "Diogo Costa", position: "Goalkeeper", age: 25, caps: 22 },
    { name: "Rui Patrício", position: "Goalkeeper", age: 36, caps: 108 },
    { name: "Rúben Dias", position: "Defender", age: 27, caps: 55 },
    { name: "Pepe", position: "Defender", age: 41, caps: 141 },
    { name: "João Cancelo", position: "Defender", age: 30, caps: 58 },
    { name: "Nuno Mendes", position: "Defender", age: 22, caps: 28 },
    { name: "António Silva", position: "Defender", age: 21, caps: 15 },
    { name: "Bruno Fernandes", position: "Midfielder", age: 30, caps: 68 },
    { name: "Vitinha", position: "Midfielder", age: 24, caps: 28 },
    { name: "João Palhinha", position: "Midfielder", age: 29, caps: 32 },
    { name: "Bernardo Silva", position: "Midfielder", age: 30, caps: 92 },
    { name: "Cristiano Ronaldo", position: "Forward", age: 39, caps: 212 },
    { name: "Rafael Leão", position: "Forward", age: 25, caps: 32 },
    { name: "João Félix", position: "Forward", age: 25, caps: 35 },
    { name: "Diogo Jota", position: "Forward", age: 28, caps: 38 },
    { name: "Gonçalo Ramos", position: "Forward", age: 23, caps: 18 },
    { name: "Francisco Conceição", position: "Forward", age: 22, caps: 10 },
  ],
  'Brazilië': [
    { name: "Alisson", position: "Goalkeeper", age: 32, caps: 68 },
    { name: "Ederson", position: "Goalkeeper", age: 31, caps: 22 },
    { name: "Marquinhos", position: "Defender", age: 30, caps: 82 },
    { name: "Éder Militão", position: "Defender", age: 26, caps: 32 },
    { name: "Danilo", position: "Defender", age: 33, caps: 58 },
    { name: "Wendell", position: "Defender", age: 31, caps: 12 },
    { name: "Guilherme Arana", position: "Defender", age: 27, caps: 15 },
    { name: "Casemiro", position: "Midfielder", age: 32, caps: 75 },
    { name: "Lucas Paquetá", position: "Midfielder", age: 27, caps: 52 },
    { name: "Bruno Guimarães", position: "Midfielder", age: 27, caps: 22 },
    { name: "Raphinha", position: "Forward", age: 28, caps: 32 },
    { name: "Vinícius Júnior", position: "Forward", age: 24, caps: 35 },
    { name: "Rodrygo", position: "Forward", age: 23, caps: 22 },
    { name: "Endrick", position: "Forward", age: 18, caps: 8 },
    { name: "Richarlison", position: "Forward", age: 27, caps: 52 },
    { name: "Gabriel Martinelli", position: "Forward", age: 23, caps: 15 },
    { name: "Savinho", position: "Forward", age: 20, caps: 5 },
  ],
  'Argentinië': [
    { name: "Emiliano Martínez", position: "Goalkeeper", age: 32, caps: 48 },
    { name: "Franco Armani", position: "Goalkeeper", age: 38, caps: 18 },
    { name: "Nicolás Otamendi", position: "Defender", age: 36, caps: 108 },
    { name: "Cristian Romero", position: "Defender", age: 26, caps: 32 },
    { name: "Lisandro Martínez", position: "Defender", age: 26, caps: 22 },
    { name: "Nahuel Molina", position: "Defender", age: 26, caps: 28 },
    { name: "Nicolás Tagliafico", position: "Defender", age: 32, caps: 52 },
    { name: "Rodrigo De Paul", position: "Midfielder", age: 30, caps: 58 },
    { name: "Leandro Paredes", position: "Midfielder", age: 30, caps: 62 },
    { name: "Enzo Fernández", position: "Midfielder", age: 23, caps: 28 },
    { name: "Alexis Mac Allister", position: "Midfielder", age: 25, caps: 42 },
    { name: "Lionel Messi", position: "Forward", age: 37, caps: 186 },
    { name: "Ángel Di María", position: "Forward", age: 36, caps: 145 },
    { name: "Lautaro Martínez", position: "Forward", age: 27, caps: 58 },
    { name: "Julián Álvarez", position: "Forward", age: 24, caps: 32 },
    { name: "Paulo Dybala", position: "Forward", age: 31, caps: 38 },
    { name: "Alejandro Garnacho", position: "Forward", age: 20, caps: 12 },
  ],
};

// Map position names to Dutch
const positionMap: Record<string, string> = {
  'Goalkeeper': 'Keeper',
  'Defender': 'Verdediger',
  'Midfielder': 'Middenvelder',
  'Forward': 'Aanvaller',
};

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

    console.log(`Processing ${country} national team players...`);

    // Get players for the requested country
    const knownPlayers = countryPlayers[country];
    
    if (!knownPlayers) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Country "${country}" not supported. Available: ${Object.keys(countryPlayers).join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const players: PlayerData[] = [];
    
    // Search for player images using Firecrawl
    console.log(`Fetching player images for ${knownPlayers.length} players...`);
    
    for (const player of knownPlayers) {
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
            query: `${player.name} ${country} football player photo`,
            limit: 1,
          }),
        });
        
        const imageSearchData = await imageSearchResponse.json();
        
        // Try to extract image URL from search results
        if (imageSearchData.success && imageSearchData.data && imageSearchData.data.length > 0) {
          const firstResult = imageSearchData.data[0];
          if (firstResult.metadata?.ogImage) {
            imageUrl = firstResult.metadata.ogImage;
          }
        }
        
        console.log(`Image for ${player.name}: ${imageUrl ? 'found' : 'not found'}`);
      } catch (imgError) {
        console.error(`Error fetching image for ${player.name}:`, imgError);
      }

      players.push({
        name: player.name,
        position: positionMap[player.position] || player.position,
        age: player.age,
        international_caps: player.caps,
        image_url: imageUrl,
      });
    }

    console.log(`Processed ${players.length} players`);

    // Get existing players from this country
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
        message: `Processed ${players.length} ${country} players`,
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
