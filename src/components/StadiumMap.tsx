import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Stadium {
  name: string;
  city: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
}

const STADIUMS: Stadium[] = [
  // USA Stadiums
  { name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: 'USA', coordinates: [-74.0744, 40.8135], capacity: 82500 },
  { name: 'SoFi Stadium', city: 'Inglewood, CA', country: 'USA', coordinates: [-118.3392, 33.9535], capacity: 70240 },
  { name: 'AT&T Stadium', city: 'Arlington, TX', country: 'USA', coordinates: [-97.0929, 32.7473], capacity: 80000 },
  { name: 'Hard Rock Stadium', city: 'Miami Gardens, FL', country: 'USA', coordinates: [-80.2389, 25.9580], capacity: 64767 },
  { name: 'NRG Stadium', city: 'Houston, TX', country: 'USA', coordinates: [-95.4107, 29.6847], capacity: 72220 },
  { name: 'Mercedes-Benz Stadium', city: 'Atlanta, GA', country: 'USA', coordinates: [-84.4011, 33.7553], capacity: 71000 },
  { name: 'Lincoln Financial Field', city: 'Philadelphia, PA', country: 'USA', coordinates: [-75.1675, 39.9008], capacity: 69176 },
  { name: 'Lumen Field', city: 'Seattle, WA', country: 'USA', coordinates: [-122.3316, 47.5952], capacity: 68740 },
  { name: "Levi's Stadium", city: 'Santa Clara, CA', country: 'USA', coordinates: [-121.9700, 37.4033], capacity: 68500 },
  { name: 'Arrowhead Stadium', city: 'Kansas City, MO', country: 'USA', coordinates: [-94.4839, 39.0489], capacity: 76416 },
  { name: 'Gillette Stadium', city: 'Foxborough, MA', country: 'USA', coordinates: [-71.2643, 42.0909], capacity: 65878 },
  // Mexico Stadiums
  { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', coordinates: [-99.1506, 19.3029], capacity: 87523 },
  { name: 'Estadio BBVA', city: 'Guadalupe, Monterrey', country: 'Mexico', coordinates: [-100.0095, 25.6699], capacity: 53500 },
  { name: 'Estadio Akron', city: 'Zapopan, Guadalajara', country: 'Mexico', coordinates: [-103.4605, 20.6821], capacity: 49850 },
  // Canada Stadium
  { name: 'BC Place', city: 'Vancouver, BC', country: 'Canada', coordinates: [-123.1115, 49.2768], capacity: 54500 },
  { name: 'BMO Field', city: 'Toronto, ON', country: 'Canada', coordinates: [-79.4186, 43.6332], capacity: 45500 },
];

const StadiumMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [inputToken, setInputToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch token from global_settings
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('setting_value')
          .eq('setting_key', 'mapbox_token')
          .single();

        if (data && !error) {
          const token = data.setting_value as string;
          if (token) {
            setMapboxToken(token);
          }
        }
      } catch (e) {
        console.log('No mapbox token found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Save token to global_settings
  const saveToken = async () => {
    if (!inputToken.trim()) {
      toast.error('Voer een geldige Mapbox token in');
      return;
    }

    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert({
          setting_key: 'mapbox_token',
          setting_value: JSON.stringify(inputToken.trim()),
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      setMapboxToken(inputToken.trim());
      toast.success('Mapbox token opgeslagen');
    } catch (e) {
      toast.error('Kon token niet opslaan');
    }
  };

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-98, 38], // Center of North America
        zoom: 3.5,
        pitch: 30,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add markers for each stadium
      STADIUMS.forEach((stadium) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'stadium-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        `;
        el.onmouseenter = () => {
          el.style.transform = 'scale(1.3)';
        };
        el.onmouseleave = () => {
          el.style.transform = 'scale(1)';
        };

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          maxWidth: '300px',
        }).setHTML(`
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #1f2937;">${stadium.name}</h3>
            <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">${stadium.city}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
              <span style="
                padding: 2px 8px;
                background: ${stadium.country === 'USA' ? '#3b82f6' : stadium.country === 'Mexico' ? '#22c55e' : '#ef4444'};
                color: white;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
              ">${stadium.country}</span>
              <span style="font-size: 11px; color: #9ca3af;">
                ${stadium.capacity.toLocaleString()} plaatsen
              </span>
            </div>
          </div>
        `);

        // Add marker
        new mapboxgl.Marker(el)
          .setLngLat(stadium.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Add atmosphere effect
      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(20, 20, 30)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.4,
        });
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      toast.error('Kon kaart niet laden. Controleer je Mapbox token.');
      setMapboxToken('');
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show token input if no token
  if (!mapboxToken) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            WK 2026 Stadions Kaart
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Om de kaart te tonen heb je een Mapbox public token nodig. 
            Maak gratis een account aan op{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
            {' '}en kopieer je public token uit de Tokens sectie.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Plak je Mapbox public token hier..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={saveToken}>
              <Save className="h-4 w-4 mr-2" />
              Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            WK 2026 Stadions
          </CardTitle>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500" /> USA (11)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" /> Mexico (3)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Canada (2)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          className="w-full h-[500px] md:h-[600px] rounded-b-lg"
        />
      </CardContent>
    </Card>
  );
};

export default StadiumMap;
