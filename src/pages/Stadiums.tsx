import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StadiumMap from '@/components/StadiumMap';
import { MapPin, Users, Trophy } from 'lucide-react';

const Stadiums = () => {
  const stadiumStats = [
    { icon: MapPin, label: 'Stadions', value: '16' },
    { icon: Users, label: 'Totale capaciteit', value: '1.1M+' },
    { icon: Trophy, label: 'Landen', value: '3' },
  ];

  return (
    <>
      <Helmet>
        <title>WK 2026 Stadions | Alle locaties in VS, Mexico & Canada</title>
        <meta 
          name="description" 
          content="Bekijk alle 16 WK 2026 stadions op een interactieve kaart. Ontdek de speellocaties in de Verenigde Staten, Mexico en Canada." 
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              WK 2026 Stadions
            </h1>
            <p className="text-muted-foreground">
              Ontdek alle 16 speellocaties van het WK 2026 in de Verenigde Staten, Mexico en Canada
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stadiumStats.map((stat) => (
              <div 
                key={stat.label}
                className="bg-card border border-border rounded-lg p-4 text-center"
              >
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Map */}
          <StadiumMap />

          {/* Stadium List */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', matches: 8 },
              { name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', matches: 6 },
              { name: 'AT&T Stadium', city: 'Dallas', country: 'USA', matches: 6 },
              { name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', matches: 6 },
              { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', matches: 5 },
              { name: 'NRG Stadium', city: 'Houston', country: 'USA', matches: 5 },
              { name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', matches: 5 },
              { name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', matches: 5 },
              { name: 'Lumen Field', city: 'Seattle', country: 'USA', matches: 5 },
              { name: "Levi's Stadium", city: 'San Francisco', country: 'USA', matches: 5 },
              { name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', matches: 5 },
              { name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', matches: 5 },
              { name: 'BC Place', city: 'Vancouver', country: 'Canada', matches: 5 },
            ].map((stadium) => (
              <div 
                key={stadium.name}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{stadium.name}</h3>
                    <p className="text-sm text-muted-foreground">{stadium.city}</p>
                  </div>
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${stadium.country === 'USA' ? 'bg-blue-500/20 text-blue-400' : ''}
                    ${stadium.country === 'Mexico' ? 'bg-green-500/20 text-green-400' : ''}
                    ${stadium.country === 'Canada' ? 'bg-red-500/20 text-red-400' : ''}
                  `}>
                    {stadium.country}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {stadium.matches} wedstrijden
                </div>
              </div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Stadiums;
