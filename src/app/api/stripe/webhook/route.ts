import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return new NextResponse("Webhook Secret Missing", { status: 400 });
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      // Update the booking status in Supabase
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ deposit_paid: true, status: 'confirmed', stripe_session_id: session.id })
        .eq('id', bookingId);
        
      if (error) {
        console.error("Supabase update error:", error);
        return new NextResponse("Database Error", { status: 500 });
      }

      // Fetch booking details for the email
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        try {
          await resend.emails.send({
            from: 'MenuFlow <onboarding@resend.dev>',
            to: booking.contact_email,
            subject: 'Confirmation de votre réservation - Brasserie Sainte-Rose',
            html: `
              <h1>Merci pour votre réservation !</h1>
              <p>Bonjour ${booking.contact_name},</p>
              <p>Votre réservation pour le <strong>${booking.date}</strong> à <strong>${booking.time_slot}</strong> est confirmée.</p>
              <p>Nombre de convives : ${booking.party_size}</p>
              <p>Dépôt de 25$ CAD payé avec succès.</p>
              <br />
              <p>À bientôt,</p>
              <p>L'équipe de la Brasserie Sainte-Rose</p>
            `
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          // Don't fail the webhook if email fails
        }
      }
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
