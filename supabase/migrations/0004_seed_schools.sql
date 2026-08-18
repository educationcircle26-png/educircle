-- Temporary seed data: real, well-known international schools in Egypt,
-- entered manually with only public general-knowledge info (area,
-- curriculum, year range). No fabricated stats, fees, or contact info.
-- Safe to edit/replace once real school data collection is in place.
insert into public.schools (name, area, curriculum, min_year, max_year, description) values
  ('Cairo English School (CES)', 'New Cairo', array['British'], 'Nursery', 'Year 13', 'A British curriculum school in New Cairo.'),
  ('British International School Cairo (BISC)', 'New Cairo', array['British', 'IB'], 'Nursery', 'Year 13', 'A British and IB curriculum school in New Cairo.'),
  ('American International School in Egypt (AIS)', 'New Cairo', array['American'], 'KG1', 'Grade 12', 'An American curriculum school in New Cairo.'),
  ('Cairo American College (CAC)', 'Maadi', array['American', 'IB'], 'KG1', 'Grade 12', 'An American and IB curriculum school in Maadi.'),
  ('El Alsson School', '6th October', array['British', 'American'], 'Nursery', 'Grade 12', 'A British and American curriculum school in 6th of October.'),
  ('Malvern College Egypt', 'New Cairo', array['British'], 'Nursery', 'Year 13', 'A British curriculum school in New Cairo.'),
  ('King''s College Egypt', 'New Cairo', array['British'], 'Nursery', 'Year 13', 'A British curriculum school in New Cairo.'),
  ('International School of Choueifat - Cairo (SABIS)', '6th October', array['American'], 'KG1', 'Grade 12', 'A SABIS-network American curriculum school in 6th of October.'),
  ('New Cairo British International School (NCBIS)', 'New Cairo', array['British'], 'Nursery', 'Year 13', 'A British curriculum school in New Cairo.'),
  ('Lycee Francais du Caire', 'Cairo', array['French', 'National'], 'Maternelle', 'Terminale', 'A French curriculum school in Cairo.');
