import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
// import twilio from "twilio";

// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: Request) {
  // Verifying cron secret to block unauthorized calls
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  const { addDays, format } = await import("date-fns");
  const targetDate = format(addDays(new Date(), 2), "yyyy-MM-dd");

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('date', targetDate)
    .eq('status', 'confirmed');

  if (error) {
    console.error("Supabase fetch error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }

  const twilio = await import("twilio");
  const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const results = await Promise.allSettled(bookings.map(async (booking) => {
    return client.messages.create({
      body: `Rappel : Votre r\u00e9servation \u00e0 la Brasserie Sainte-Rose est pour dans 48h (${booking.date} \u00e0 ${booking.time_slot}). nous avons h\u00e2te de vous voir !`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: booking.contact_phone
    });
  }));

  console.log("SMS Reminders sent:", results.filter(r => r.status === 'fulfilled').length);
  
  return new NextResponse(`SMS reminders processed: ${bookings.length} found`, { status: 200 });
}
