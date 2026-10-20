"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Mock Data
const TIME_SLOTS = ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];
const MENU = {
  starters: [
    { id: "s1", name: "Soupe à l'oignon gratinée" },
    { id: "s2", name: "Gravlax de saumon" },
    { id: "s3", name: "Escargots au beurre persillé" }
  ],
  mains: [
    { id: "m1", name: "Steak Frites" },
    { id: "m2", name: "Magret de canard" },
    { id: "m3", name: "Filet de doré amandine" },
    { id: "m4", name: "Risotto aux champignons sauvages" },
    { id: "m5", name: "Burger Sainte-Rose" }
  ],
  desserts: [
    { id: "d1", name: "Crème brûlée à la vanille" },
    { id: "d2", name: "Tarte tatin aux pommes" },
    { id: "d3", name: "Fondant au chocolat" }
  ]
};

type GuestSelection = {
  starter: string;
  main: string;
  dessert: string;
  notes: string;
};

export default function BookPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1 State
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [partySize, setPartySize] = useState([8]);
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });

  // Step 2 State
  const [guests, setGuests] = useState<GuestSelection[]>(Array(8).fill({ starter: "", main: "", dessert: "", notes: "" }));

  const isStep1Valid = date && time && contactInfo.name && contactInfo.email && contactInfo.phone;
  const isStep2Valid = guests.every(g => g.starter && g.main && g.dessert);

  // Auto-adjust guests array when slider changes
  const handlePartySizeChange = (val: number[]) => {
    setPartySize(val);
    if (val[0] > guests.length) {
      setGuests([...guests, ...Array(val[0] - guests.length).fill({ starter: "", main: "", dessert: "", notes: "" })]);
    } else {
      setGuests(guests.slice(0, val[0]));
    }
  };

  const updateGuest = (index: number, field: keyof GuestSelection, value: string) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date ? format(date, "yyyy-MM-dd") : "", // Format as string for Postgres
          time,
          partySize: partySize[0],
          contactInfo,
          guests: guests.map(g => ({
            ...g,
            // Convert IDs back to names if necessary, 
            // but the DB expects text so we can send names or IDs
            starter: MENU.starters.find(s => s.id === g.starter)?.name || g.starter,
            main: MENU.mains.find(m => m.id === g.main)?.name || g.main,
            dessert: MENU.desserts.find(d => d.id === g.dessert)?.name || g.dessert,
          }))
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert("Erreur lors de la redirection vers Stripe. Veuillez réessayer.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-5xl py-12 mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-primary mb-3">Réserver une table</h1>
        <p className="text-muted-foreground text-lg">Étape {step} sur 3</p>
        <div className="flex w-full max-w-md mx-auto h-2 bg-secondary mt-4 rounded-full overflow-hidden">
          <div className="bg-primary h-full transition-all duration-500 ease-in-out" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 border-2">
          <CardHeader>
            <CardTitle>Détails de la réservation</CardTitle>
            <CardDescription>Sélectionnez la date, l'heure et la taille de votre groupe pour vérifier les disponibilités.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-lg">Date de réservation</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={fr} disabled={(d) => d < new Date() || d < new Date("1900-01-01")} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <Label className="text-lg">Heure</Label>
                <Select onValueChange={setTime} value={time}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionner une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-end">
                <Label className="text-lg">Taille du groupe (8 - 40 personnes)</Label>
                <span className="text-2xl font-bold text-primary">{partySize[0]} convives</span>
              </div>
              <Slider defaultValue={[8]} max={40} min={8} step={1} value={partySize} onValueChange={handlePartySizeChange} className="py-4" />
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
              <Label className="text-lg">Vos coordonnées</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" placeholder="Jean Dupont" value={contactInfo.name} onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="jean@example.com" value={contactInfo.email} onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" type="tel" placeholder="450-555-5555" value={contactInfo.phone} onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button size="lg" disabled={!isStep1Valid} onClick={() => setStep(2)}>Continuer vers le menu</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
            <h2 className="text-2xl font-semibold text-center w-full">Choix des plats pour {partySize[0]} convives</h2>
            <Button disabled={!isStep2Valid} onClick={() => setStep(3)}>Valider le menu</Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {guests.map((guest, idx) => (
              <Card key={idx} className={isStep2Valid || (guest.starter && guest.main && guest.dessert) ? "border-green-200" : ""}>
                <CardHeader className="bg-muted/50 pb-4">
                  <CardTitle className="text-lg">Convive {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  <div className="space-y-2">
                    <Label>Entrée</Label>
                    <Select onValueChange={(v) => updateGuest(idx, 'starter', v)} value={guest.starter}>
                      <SelectTrigger><SelectValue placeholder="Choisir une entrée" /></SelectTrigger>
                      <SelectContent>
                        {MENU.starters.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Plat principal</Label>
                    <Select onValueChange={(v) => updateGuest(idx, 'main', v)} value={guest.main}>
                      <SelectTrigger><SelectValue placeholder="Choisir un plat" /></SelectTrigger>
                      <SelectContent>
                        {MENU.mains.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dessert</Label>
                    <Select onValueChange={(v) => updateGuest(idx, 'dessert', v)} value={guest.dessert}>
                      <SelectTrigger><SelectValue placeholder="Choisir un dessert" /></SelectTrigger>
                      <SelectContent>
                        {MENU.desserts.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Allergies / Notes</Label>
                    <Input placeholder="(Optionnel)" value={guest.notes} onChange={(e) => updateGuest(idx, 'notes', e.target.value)} />
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-6">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>Retour</Button>
            <Button size="lg" disabled={!isStep2Valid} onClick={() => setStep(3)}>Procéder au paiement (Dépôt)</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-2 bg-muted/30">
              <CardTitle className="text-2xl">Dépôt requis</CardTitle>
              <CardDescription className="text-lg pt-2">Un dépôt fixe de 25 $ CAD est requis pour confirmer votre réservation.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-lg bg-orange-50/50 p-6 mb-8 border border-orange-100">
                <h3 className="font-semibold mb-4 text-lg">Résumé de réservation</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{date ? format(date, "PPP", { locale: fr }) : ""}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Heure:</span>
                    <span className="font-medium">{time}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Groupe:</span>
                    <span className="font-medium">{partySize[0]} personnes</span>
                  </li>
                  <li className="flex justify-between pt-3 border-t border-orange-200">
                    <span className="font-semibold text-base">Total à payer aujourd'hui:</span>
                    <span className="font-bold text-primary text-lg">25.00 $ CAD</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" size="lg" className="w-1/3" onClick={() => setStep(2)}>Retour</Button>
                <Button size="lg" className="w-2/3" onClick={handleCheckout} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</>
                  ) : (
                    "Payer 25 $ via Stripe"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
