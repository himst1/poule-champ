-- Group Stage Updates - June 11-25, 2026

-- June 11, 2026
UPDATE matches SET stadium = 'Estadio Azteca', city = 'Mexico City' WHERE home_team = 'Mexico' AND away_team = 'TBD' AND kickoff_time::date = '2026-06-11';

-- June 12, 2026
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE kickoff_time::date = '2026-06-12' AND phase = 'Groep A';
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE kickoff_time::date = '2026-06-12' AND phase = 'Groep B';
UPDATE matches SET stadium = 'SoFi Stadium', city = 'Los Angeles' WHERE kickoff_time::date = '2026-06-12' AND phase = 'Groep C';

-- June 13, 2026
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE kickoff_time::date = '2026-06-13' AND phase = 'Groep D';
UPDATE matches SET stadium = 'NRG Stadium', city = 'Houston' WHERE kickoff_time::date = '2026-06-13' AND phase = 'Groep E';
UPDATE matches SET stadium = 'Mercedes-Benz Stadium', city = 'Atlanta' WHERE kickoff_time::date = '2026-06-13' AND phase = 'Groep F';

-- June 14, 2026
UPDATE matches SET stadium = 'Lincoln Financial Field', city = 'Philadelphia' WHERE kickoff_time::date = '2026-06-14' AND phase = 'Groep G';
UPDATE matches SET stadium = 'Lumen Field', city = 'Seattle' WHERE kickoff_time::date = '2026-06-14' AND phase = 'Groep H';
UPDATE matches SET stadium = 'Levi''s Stadium', city = 'San Francisco Bay Area' WHERE kickoff_time::date = '2026-06-14' AND phase = 'Groep I';

-- June 15, 2026
UPDATE matches SET stadium = 'Estadio BBVA', city = 'Monterrey' WHERE kickoff_time::date = '2026-06-15' AND phase = 'Groep J';
UPDATE matches SET stadium = 'Estadio Akron', city = 'Guadalajara' WHERE kickoff_time::date = '2026-06-15' AND phase = 'Groep K';
UPDATE matches SET stadium = 'BC Place', city = 'Vancouver' WHERE kickoff_time::date = '2026-06-15' AND phase = 'Groep L';

-- June 16, 2026 - Group A/B/C second matches
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE kickoff_time::date = '2026-06-16' AND phase = 'Groep A';
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE kickoff_time::date = '2026-06-16' AND phase = 'Groep B';
UPDATE matches SET stadium = 'SoFi Stadium', city = 'Los Angeles' WHERE kickoff_time::date = '2026-06-16' AND phase = 'Groep C';

-- June 17, 2026 - Group D/E/F second matches
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE kickoff_time::date = '2026-06-17' AND phase = 'Groep D';
UPDATE matches SET stadium = 'NRG Stadium', city = 'Houston' WHERE kickoff_time::date = '2026-06-17' AND phase = 'Groep E';
UPDATE matches SET stadium = 'Mercedes-Benz Stadium', city = 'Atlanta' WHERE kickoff_time::date = '2026-06-17' AND phase = 'Groep F';

-- June 18, 2026 - Group G/H/I second matches
UPDATE matches SET stadium = 'Lincoln Financial Field', city = 'Philadelphia' WHERE kickoff_time::date = '2026-06-18' AND phase = 'Groep G';
UPDATE matches SET stadium = 'Lumen Field', city = 'Seattle' WHERE kickoff_time::date = '2026-06-18' AND phase = 'Groep H';
UPDATE matches SET stadium = 'Levi''s Stadium', city = 'San Francisco Bay Area' WHERE kickoff_time::date = '2026-06-18' AND phase = 'Groep I';

-- June 19, 2026 - Group J/K/L second matches
UPDATE matches SET stadium = 'Estadio BBVA', city = 'Monterrey' WHERE kickoff_time::date = '2026-06-19' AND phase = 'Groep J';
UPDATE matches SET stadium = 'Estadio Akron', city = 'Guadalajara' WHERE kickoff_time::date = '2026-06-19' AND phase = 'Groep K';
UPDATE matches SET stadium = 'BC Place', city = 'Vancouver' WHERE kickoff_time::date = '2026-06-19' AND phase = 'Groep L';

-- June 20, 2026 - Group A/B/C third matches  
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE kickoff_time::date = '2026-06-20' AND phase = 'Groep A';
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE kickoff_time::date = '2026-06-20' AND phase = 'Groep B';
UPDATE matches SET stadium = 'SoFi Stadium', city = 'Los Angeles' WHERE kickoff_time::date = '2026-06-20' AND phase = 'Groep C';

-- June 21, 2026 - Group D/E/F third matches
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE kickoff_time::date = '2026-06-21' AND phase = 'Groep D';
UPDATE matches SET stadium = 'NRG Stadium', city = 'Houston' WHERE kickoff_time::date = '2026-06-21' AND phase = 'Groep E';
UPDATE matches SET stadium = 'Mercedes-Benz Stadium', city = 'Atlanta' WHERE kickoff_time::date = '2026-06-21' AND phase = 'Groep F';

-- June 22, 2026 - Group G/H/I third matches
UPDATE matches SET stadium = 'Lincoln Financial Field', city = 'Philadelphia' WHERE kickoff_time::date = '2026-06-22' AND phase = 'Groep G';
UPDATE matches SET stadium = 'Lumen Field', city = 'Seattle' WHERE kickoff_time::date = '2026-06-22' AND phase = 'Groep H';
UPDATE matches SET stadium = 'Levi''s Stadium', city = 'San Francisco Bay Area' WHERE kickoff_time::date = '2026-06-22' AND phase = 'Groep I';

-- June 23, 2026 - Group J/K/L third matches
UPDATE matches SET stadium = 'Estadio BBVA', city = 'Monterrey' WHERE kickoff_time::date = '2026-06-23' AND phase = 'Groep J';
UPDATE matches SET stadium = 'Estadio Akron', city = 'Guadalajara' WHERE kickoff_time::date = '2026-06-23' AND phase = 'Groep K';
UPDATE matches SET stadium = 'BC Place', city = 'Vancouver' WHERE kickoff_time::date = '2026-06-23' AND phase = 'Groep L';

-- June 24, 2026 - Group A/B/C/D final matches
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE kickoff_time::date = '2026-06-24' AND phase = 'Groep A';
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE kickoff_time::date = '2026-06-24' AND phase = 'Groep B';
UPDATE matches SET stadium = 'SoFi Stadium', city = 'Los Angeles' WHERE kickoff_time::date = '2026-06-24' AND phase = 'Groep C';
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE kickoff_time::date = '2026-06-24' AND phase = 'Groep D';

-- June 25, 2026 - Group E/F/G/H final matches
UPDATE matches SET stadium = 'NRG Stadium', city = 'Houston' WHERE kickoff_time::date = '2026-06-25' AND phase = 'Groep E';
UPDATE matches SET stadium = 'Mercedes-Benz Stadium', city = 'Atlanta' WHERE kickoff_time::date = '2026-06-25' AND phase = 'Groep F';
UPDATE matches SET stadium = 'Lincoln Financial Field', city = 'Philadelphia' WHERE kickoff_time::date = '2026-06-25' AND phase = 'Groep G';
UPDATE matches SET stadium = 'Lumen Field', city = 'Seattle' WHERE kickoff_time::date = '2026-06-25' AND phase = 'Groep H';

-- June 26, 2026 - Group I/J/K/L final matches
UPDATE matches SET stadium = 'Levi''s Stadium', city = 'San Francisco Bay Area' WHERE kickoff_time::date = '2026-06-26' AND phase = 'Groep I';
UPDATE matches SET stadium = 'Estadio BBVA', city = 'Monterrey' WHERE kickoff_time::date = '2026-06-26' AND phase = 'Groep J';
UPDATE matches SET stadium = 'Estadio Akron', city = 'Guadalajara' WHERE kickoff_time::date = '2026-06-26' AND phase = 'Groep K';
UPDATE matches SET stadium = 'BC Place', city = 'Vancouver' WHERE kickoff_time::date = '2026-06-26' AND phase = 'Groep L';

-- Round of 32 - June 28-July 2, 2026
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-06-28' AND EXTRACT(HOUR FROM kickoff_time) < 20;
UPDATE matches SET stadium = 'SoFi Stadium', city = 'Los Angeles' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-06-28' AND EXTRACT(HOUR FROM kickoff_time) >= 20;
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-06-29' AND EXTRACT(HOUR FROM kickoff_time) < 20;
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-06-29' AND EXTRACT(HOUR FROM kickoff_time) >= 20;
UPDATE matches SET stadium = 'NRG Stadium', city = 'Houston' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-06-30' AND EXTRACT(HOUR FROM kickoff_time) < 20;
UPDATE matches SET stadium = 'Mercedes-Benz Stadium', city = 'Atlanta' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-06-30' AND EXTRACT(HOUR FROM kickoff_time) >= 20;
UPDATE matches SET stadium = 'Lincoln Financial Field', city = 'Philadelphia' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-07-01' AND EXTRACT(HOUR FROM kickoff_time) < 20;
UPDATE matches SET stadium = 'Lumen Field', city = 'Seattle' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-07-01' AND EXTRACT(HOUR FROM kickoff_time) >= 20;
UPDATE matches SET stadium = 'Levi''s Stadium', city = 'San Francisco Bay Area' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-07-02' AND EXTRACT(HOUR FROM kickoff_time) < 18;
UPDATE matches SET stadium = 'Estadio BBVA', city = 'Monterrey' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-07-02' AND EXTRACT(HOUR FROM kickoff_time) >= 18 AND EXTRACT(HOUR FROM kickoff_time) < 21;
UPDATE matches SET stadium = 'Estadio Akron', city = 'Guadalajara' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-07-02' AND EXTRACT(HOUR FROM kickoff_time) >= 21;
UPDATE matches SET stadium = 'BC Place', city = 'Vancouver' WHERE phase = 'Achtste Finale' AND kickoff_time::date = '2026-07-03';

-- Quarter Finals - July 4-5, 2026
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE phase = 'Kwartfinale' AND kickoff_time::date = '2026-07-04' AND EXTRACT(HOUR FROM kickoff_time) < 20;
UPDATE matches SET stadium = 'SoFi Stadium', city = 'Los Angeles' WHERE phase = 'Kwartfinale' AND kickoff_time::date = '2026-07-04' AND EXTRACT(HOUR FROM kickoff_time) >= 20;
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE phase = 'Kwartfinale' AND kickoff_time::date = '2026-07-05' AND EXTRACT(HOUR FROM kickoff_time) < 20;
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE phase = 'Kwartfinale' AND kickoff_time::date = '2026-07-05' AND EXTRACT(HOUR FROM kickoff_time) >= 20;

-- Semi Finals - July 8-9, 2026
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE phase = 'Halve Finale' AND kickoff_time::date = '2026-07-08';
UPDATE matches SET stadium = 'AT&T Stadium', city = 'Dallas' WHERE phase = 'Halve Finale' AND kickoff_time::date = '2026-07-09';

-- Third Place Match - July 12, 2026
UPDATE matches SET stadium = 'Hard Rock Stadium', city = 'Miami' WHERE phase = 'Troostfinale' AND kickoff_time::date = '2026-07-12';

-- Final - July 19, 2026
UPDATE matches SET stadium = 'MetLife Stadium', city = 'New York/New Jersey' WHERE phase = 'Finale' AND kickoff_time::date = '2026-07-19';