# MenuFlow - Brasserie Sainte-Rose

MenuFlow est une application de gestion de r\u00e9servations pour la Brasserie Sainte-Rose. Elle permet aux clients de r\u00e9server des tables pour des groupes (8 \u00e0 40 personnes), de pr\u00e9-s\u00e9lectionner leurs menus, et de payer un d\u00e9p\u00f4t de garantie via Stripe.

## Fonctionnalit\u00e9s

### C\u00f4t\u00e9 Client
- **Wizard de r\u00e9servation** en 3 \u00e9tapes :
  1. Choix du nombre de convives, de la date et de l'heure.
  2. S\u00e9lection individuelle des plats (entr\u00e9e, plat, dessert) par convive avec gestion des allerg\u00e8nes.
  3. Paiement du d\u00e9p\u00f4t de 25 $ CAD via Stripe Checkout.
- **Confirmation automatis\u00e9e** par email (Resend) et ajout au calendrier (Google Calendar).

### C\u00f4t\u00e9 Administration (Dashboard)
- **Authentification s\u00e9curis\u00e9e** via Supabase Auth.
- **Vue Calendrier** (`react-big-calendar`) pour visualiser toutes les r\u00e9servations.
- **Gestion des r\u00e9servations** : D\u00e9tail complet, changement de statut, et annulation avec remboursement automatis\u00e9 (> 72h).
- **Export PDF** : G\u00e9n\u00e9ration de bons de cuisine pour la pr\u00e9paration des commandes.

## Configuration

### Environnement
Copiez le fichier `.env.local.example` vers `.env.local` et remplissez les variables suivantes :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Resend & Twilio
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Installation

```bash
npm install
npm run dev
```

### Base de donn\u00e9es
Le projet utilise Supabase. Les migrations et le seed initial du menu se trouvent dans le dossier `supabase/migrations`.

## Automatisations
- **Webhooks Stripe** : G\u00e8re la confirmation des r\u00e9servations en dB.
- **Rappels SMS** : Route API `/api/reminders/sms` pr\u00e9vue pour \u00eatre appel\u00e9e par un cron job (48h avant).
- **Remboursements** : Logique de remboursement automatique int\u00e9gr\u00e9e lors de l'annulation via le Dashboard.
