import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { date, time, partySize, contactInfo, guests } = await req.json();

    // 1. Create the booking in Supabase
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        date,
        time_slot: time,
        party_size: partySize,
        contact_name: contactInfo.name,
        contact_email: contactInfo.email,
        contact_phone: contactInfo.phone,
        status: 'pending',
        deposit_paid: false
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 2. Create the guests entries
    const guestsData = guests.map((guest: any, index: number) => ({
      booking_id: booking.id,
      guest_number: index + 1,
      starter: guest.starter,
      main: guest.main,
      dessert: guest.dessert,
      dietary_notes: guest.notes
    }));

    const { error: guestsError } = await supabaseAdmin
      .from('booking_guests')
      .insert(guestsData);

    if (guestsError) throw guestsError;

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Dépôt de réservation - Brasserie Sainte-Rose',
              description: `Réservation pour ${partySize} personnes le ${date} à ${time}`,
            },
            unit_amount: 2500, // $25.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/book?error=payment_cancelled`,
      metadata: {
        booking_id: booking.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
