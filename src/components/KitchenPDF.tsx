"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  section: { margin: 10, padding: 10, flexGrow: 1 },
  text: { fontSize: 12, marginBottom: 4 },
  boldText: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  guestBlock: { marginBottom: 15, paddingBottom: 10, borderBottom: '1 solid #EEE' },
});

export const KitchenPDF = ({ booking }: { booking: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Bons de Cuisine - Brasserie Sainte-Rose</Text>
      
      <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9' }}>
        <Text style={styles.text}>Client: {booking.contact_name} ({booking.contact_phone})</Text>
        <Text style={styles.boldText}>Date: {booking.date.toLocaleDateString('fr-FR')} - Heure: {booking.time_slot}</Text>
        <Text style={styles.boldText}>Groupe: {booking.party_size} personnes</Text>
        <Text style={styles.text}>Statut: {booking.status.toUpperCase()}</Text>
      </View>

      <Text style={{ fontSize: 16, marginTop: 15, marginBottom: 10, fontWeight: 'bold' }}>Commandes Individuelles:</Text>
      
      {booking.guests.map((guest: any, idx: number) => (
        <View key={idx} style={styles.guestBlock}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>Convive {idx + 1}</Text>
          <Text style={styles.text}>- Entrée: {guest.starter || 'Non spécifié'}</Text>
          <Text style={styles.text}>- Plat: {guest.main || 'Non spécifié'}</Text>
          <Text style={styles.text}>- Dessert: {guest.dessert || 'Non spécifié'}</Text>
          {guest.notes && <Text style={{ fontSize: 12, color: 'red', marginTop: 4 }}>⚠️ Notes: {guest.notes}</Text>}
        </View>
      ))}
    </Page>
  </Document>
);

export const generatePdf = async (booking: any) => {
  const blob = await pdf(<KitchenPDF booking={booking} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Cuisine_${booking.contact_name.replace(/\s+/g, '_')}_${booking.date.toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
