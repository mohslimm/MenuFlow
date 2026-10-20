CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course text NOT NULL CHECK (course IN ('starter', 'main', 'dessert')),
  name text NOT NULL,
  description text NOT NULL,
  dietary_tags text[] DEFAULT '{}',
  active bool DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time_slot text NOT NULL,
  party_size int NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  status text DEFAULT 'pending',
  deposit_paid bool DEFAULT false,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_guests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  guest_number int NOT NULL,
  starter text,
  main text,
  dessert text,
  dietary_notes text
);

-- Seed Menu Items
INSERT INTO menu_items (course, name, description, dietary_tags) VALUES
  ('starter', 'Soupe à l''oignon gratinée', 'Bouillons de bœuf, oignons caramélisés, croûton gruyère', ARRAY['végétarien']),
  ('starter', 'Gravlax de saumon', 'Saumon mariné à l''aneth et aux baies roses, crème fraîche citronnée', ARRAY['sans gluten']),
  ('starter', 'Escargots au beurre persillé', 'Six escargots de Bourgogne servis avec du pain grillé', ARRAY[]),

  ('main', 'Steak Frites', 'Bavette de bœuf grillée, frites maison, sauce au poivre', ARRAY['sans gluten']),
  ('main', 'Magret de canard', 'Magret de canard rôti, purée de patates douces, sauce aux petits fruits', ARRAY['sans gluten']),
  ('main', 'Filet de doré amandine', 'Doré poêlé aux amandes effilées, légumes de saison', ARRAY['sans gluten']),
  ('main', 'Risotto aux champignons sauvages', 'Riz arborio crémeux, mélange de champignons forestiers, parmesan', ARRAY['végétarien', 'sans gluten']),
  ('main', 'Burger Sainte-Rose', 'Bœuf haché, bacon, fromage cheddar fort, sauce maison, frites', ARRAY[]),

  ('dessert', 'Crème brûlée à la vanille', 'Classique crème brûlée infusée à la vanille de Madagascar', ARRAY['végétarien', 'sans gluten']),
  ('dessert', 'Tarte tatin aux pommes', 'Tarte renversée aux pommes caramélisées, boule de glace vanille', ARRAY['végétarien']),
  ('dessert', 'Fondant au chocolat', 'Gâteau au chocolat cœur coulant, crème anglaise', ARRAY['végétarien']);

-- Setup RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;

-- Anonymous users (public access) can read menu items
CREATE POLICY "Public can view active menu items" ON menu_items
  FOR SELECT USING (active = true);

-- Authenticated admins can do all
CREATE POLICY "Admins can do everything on menu items" ON menu_items
  TO authenticated USING (true);

-- Anonymous users can INSER bookings
CREATE POLICY "Public can insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Anyone can select a booking if they have the ID (used for confirmation page)
CREATE POLICY "Public can read bookings by ID" ON bookings
  FOR SELECT USING (true);
  
CREATE POLICY "Public can update bookings (for payment success)" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "Admins can do everything on bookings" ON bookings
  TO authenticated USING (true);

-- Anonymous users can insert guests
CREATE POLICY "Public can insert guests" ON booking_guests
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Public can read guests" ON booking_guests
  FOR SELECT USING (true);

CREATE POLICY "Admins can do everything on booking guests" ON booking_guests
  TO authenticated USING (true);
