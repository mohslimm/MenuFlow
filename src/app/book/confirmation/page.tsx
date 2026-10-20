"use client";

import Link from "next/link";
import { CheckCircle2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="container max-w-2xl mx-auto py-20 animate-in fade-in zoom-in-95 duration-500">
      <Card className="border-green-200 border-2 shadow-xl">
        <CardHeader className="text-center pb-2 pt-10">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">Merci !</CardTitle>
          <CardDescription className="text-lg pt-4">
            Votre réservation chez Brasserie Sainte-Rose est confirmée.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-8 pt-6 pb-10">
          <p className="text-muted-foreground">
            Un email de confirmation contenant tous les détails de votre réservation et la facture de votre dépôt vous a été envoyé. Un rappel par SMS vous sera envoyé 48h avant.
          </p>
          
          {sessionId && (
            <p className="text-xs text-muted-foreground/50">Session Stripe: {sessionId}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2" onClick={() => window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Réservation+Brasserie+Sainte-Rose&dates=20240401T120000Z/20240401T140000Z', '_blank')}>
              <CalendarPlus className="w-5 h-5" />
              Ajouter au Calendrier UI
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
