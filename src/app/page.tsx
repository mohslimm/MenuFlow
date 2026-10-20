import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-primary">
          Brasserie Sainte-Rose
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Vivez une expérience culinaire chaleureuse au cœur de Laval.<br/>
          Réservez votre table et composez votre menu d'avance.
        </p>
        <div className="pt-8">
          <Link href="/book">
            <Button size="lg" className="text-lg px-10 py-7 shadow-lg rounded-full hover:scale-105 hover:shadow-xl transition-all duration-300">
              Réserver maintenant
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
