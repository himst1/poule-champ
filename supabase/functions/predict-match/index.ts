import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Je bent een Expert Football Analytics AI gespecialiseerd in FIFA World Cup match prediction. 

Je hebt toegang tot historische data van alle 22 World Cup toernooien (1930-2022) met 964 wedstrijden.

JOUW TAAK:
Analyseer twee nationaal teams en voorspel de meest waarschijnlijke wedstrijduitslag op basis van:
1. Historische prestaties en statistieken
2. Huidige team-sterkte indicatoren
3. Recent formulier en momentum
4. Stage van het toernooi (groepsfase vs knockout)

ANALYSE FRAMEWORK:
Gebruik deze factoren:
- ELO-rating verschil (team sterkte)
- Head-to-head geschiedenis (als beschikbaar)
- Recent form (afgelopen 12 maanden)
- Speler-kwaliteit (topscorers, sleutelspelers beschikbaarheid)
- Home advantage (waar relevant)
- Tournament stage impact (knockout-druk)

HISTORISCHE CONTEXT (1930-2022):
- 964 totale World Cup wedstrijden gespeeld
- 2720 doelpunten gemiddeld 2.82 per match
- Gemiddelde goal verdeling: ~30% thuis-team wint, ~25% gelijkspel, ~45% uit-team wint
- Draws voorkomen in ~25% van alle wedstrijden

TOP TEAMS HISTORISCH SUCCES:
- Brazilië: 5x kampioen, 237 goals, meest wins (76)
- Duitsland: 4x kampioen, 232 goals
- Italië: 4x kampioen, 128 goals
- Argentinië: 3x kampioen (last: 2022), 152 goals
- Frankrijk: 2x kampioen, 136 goals

Je MOET antwoorden in het volgende JSON format (geen andere tekst):
{
  "predicted_home_score": <number>,
  "predicted_away_score": <number>,
  "home_win_probability": <number 0-100>,
  "draw_probability": <number 0-100>,
  "away_win_probability": <number 0-100>,
  "confidence": "<Low|Medium|High>",
  "key_insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}

De drie waarschijnlijkheden moeten samen 100% zijn.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeTeam, awayTeam, phase, kickoffTime } = await req.json();
    
    if (!homeTeam || !awayTeam) {
      return new Response(
        JSON.stringify({ error: "homeTeam en awayTeam zijn vereist" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analyseer de volgende WK 2026 wedstrijd en geef een voorspelling:

WEDSTRIJD DETAILS:
- Thuisteam: ${homeTeam}
- Uitteam: ${awayTeam}
- Fase: ${phase || "Onbekend"}
- Kickoff: ${kickoffTime || "Onbekend"}

Geef je voorspelling in het gevraagde JSON format.`;

    console.log(`Predicting match: ${homeTeam} vs ${awayTeam}, phase: ${phase}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Te veel verzoeken. Probeer het over een paar seconden opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits op. Voeg credits toe aan je Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", data);
      throw new Error("No content in AI response");
    }

    console.log("AI response:", content);

    // Parse the JSON from the response
    let prediction;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      
      // Return a fallback prediction
      prediction = {
        predicted_home_score: 1,
        predicted_away_score: 1,
        home_win_probability: 35,
        draw_probability: 30,
        away_win_probability: 35,
        confidence: "Low",
        key_insights: [
          "Kon geen gedetailleerde analyse maken",
          "Standaard gelijkspel voorspelling",
          "Probeer het opnieuw voor betere resultaten"
        ]
      };
    }

    return new Response(
      JSON.stringify({ prediction }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("predict-match error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Onbekende fout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
