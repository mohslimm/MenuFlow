"use client";

import { useState } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { generatePdf } from '@/components/KitchenPDF';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Users, Clock, Calendar as CalendarIcon, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

moment.locale('fr');
const localizer = momentLocalizer(moment);



import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch bookings with guests
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_guests(*)')
        .order('date', { ascending: true });

      if (data) {
        const mapped = data.map(b => ({
          ...b,
          title: `${b.party_size}p - ${b.contact_name}`,
          start: new Date(`${b.date}T${b.time_slot}`),
          end: new Date(new Date(`${b.date}T${b.time_slot}`).getTime() + 2 * 60 * 60 * 1000), // +2h
          guests: b.booking_guests
        }));
        setBookings(mapped);
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedBooking) return;
    
    if (newStatus === 'cancelled') {
      const confirmCancel = confirm("Voulez-vous vraiment annuler cette r\u00e9servation ? Un remboursement sera tent\u00e9 si \u00e9ligible (>72h).");
      if (!confirmCancel) return;

      try {
        const res = await fetch("/api/bookings/cancel", {
          method: "POST",
          body: JSON.stringify({ bookingId: selectedBooking.id })
        });
        const data = await res.json();
        alert(data.message || data.error);
      } catch (err) {
        console.error("Cancel error:", err);
      }
    } else {
      await supabase.from('bookings').update({ status: newStatus }).eq('id', selectedBooking.id);
    }

    // Refresh data
    const { data } = await supabase.from('bookings').select('*, booking_guests(*)').order('date', { ascending: true });
    if (data) {
       setBookings(data.map(b => ({
          ...b,
          title: `${b.party_size}p - ${b.contact_name}`,
          start: new Date(`${b.date}T${b.time_slot}`),
          end: new Date(new Date(`${b.date}T${b.time_slot}`).getTime() + 2 * 60 * 60 * 1000),
          guests: b.booking_guests
        })));
        const updatedSelected = data.find(b => b.id === selectedBooking.id);
        if (updatedSelected) setSelectedBooking({...updatedSelected, guests: updatedSelected.booking_guests});
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <h1 className="text-2xl font-bold text-primary">MenuFlow Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>Déconnexion</Button>
      </header>
      
      <div className="flex-1 p-8 h-full min-h-0 overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border h-full p-6">
          <Calendar
            localizer={localizer}
            events={bookings}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={setSelectedBooking}
            views={['month', 'week', 'day']}
            defaultView="week"
            messages={{
              today: "Aujourd'hui",
              previous: "Précédent",
              next: "Suivant",
              month: "Mois",
              week: "Semaine",
              day: "Jour"
            }}
            eventPropGetter={(event) => {
              let backgroundColor = '#3b82f6'; // blue for confirmed
              if (event.status === 'pending') backgroundColor = '#f59e0b'; // amber
              if (event.status === 'cancelled') backgroundColor = '#ef4444'; // red
              return { style: { backgroundColor, borderRadius: '6px' } };
            }}
          />
        </div>
      </div>

      <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <SheetContent className="sm:max-w-md md:max-w-xl overflow-y-auto">
          {selectedBooking && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl flex items-center justify-between">
                  <span>Réservation de {selectedBooking.contact_name}</span>
                  <Badge variant={selectedBooking.status === 'confirmed' ? "default" : selectedBooking.status === 'pending' ? "secondary" : "destructive"} className="text-sm">
                    {selectedBooking.status.toUpperCase()}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  Gérez cette réservation et éditez le statut.
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-muted-foreground"/><span className="font-medium">{moment(selectedBooking.date).format('LL')}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground"/><span className="font-medium">{selectedBooking.time_slot}</span></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground"/><span className="font-medium">{selectedBooking.party_size} personnes</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/><span className="font-medium">{selectedBooking.contact_phone}</span></div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Action Rapides</h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-sm text-muted-foreground">Statut</label>
                      <Select defaultValue={selectedBooking.status} onValueChange={handleStatusChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente (Pending)</SelectItem>
                          <SelectItem value="confirmed">Confirmée (Confirmed)</SelectItem>
                          <SelectItem value="cancelled">Annulée (Cancelled)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="secondary" className="flex-1 gap-2" onClick={() => generatePdf(selectedBooking)}>
                      <FileText className="w-4 h-4" />
                      Export Bon Cuisine
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">Commandes individuelles</h3>
                <div className="space-y-4">
                  {selectedBooking.guests.map((g: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg bg-card text-sm space-y-2">
                      <div className="font-bold border-b pb-2 mb-2">Convive {i + 1}</div>
                      <div className="flex"><span className="w-20 font-medium text-muted-foreground">Entrée:</span> {g.starter}</div>
                      <div className="flex"><span className="w-20 font-medium text-muted-foreground">Plat:</span> {g.main}</div>
                      <div className="flex"><span className="w-20 font-medium text-muted-foreground">Dessert:</span> {g.dessert}</div>
                      {g.notes && <div className="text-red-500 font-medium mt-1">Note: {g.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
