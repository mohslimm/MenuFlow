import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { differenceInHours, parseISO } from "date-fns";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();

    // 1. Fetch booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
    }

    // 2. Check cancellation window (72 hours)
    const bookingDate = parseISO(`${booking.date}T${booking.time_slot}`);
    const now = new Date();
    const hoursUntilBooking = differenceInHours(bookingDate, now);

    let refundProcessed = false;

    // 3. Process refund if eligible (> 72h) and deposit was paid
    if (hoursUntilBooking >= 72 && booking.deposit_paid && booking.stripe_session_id) {
          // Retrieve the payment intent from the session to refund it
          const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
          if (session.payment_intent) {
            await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
              amount: 2500, // Full refund $25
            });
            refundProcessed = true;
          }
    }

    // 4. Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status: 'cancelled',
        deposit_paid: refundProcessed ? false : booking.deposit_paid 
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      refunded: refundProcessed,
      message: refundProcessed ? "Réservation annulée et dépôt remboursé." : "Réservation annulée. Aucun remboursement éligible (moins de 72h)."
    });

  } catch (error: any) {
    console.error("Cancellation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
