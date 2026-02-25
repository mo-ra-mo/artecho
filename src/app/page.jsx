import { ScrollVideoHero } from "@/components/scroll-video-hero";
import { LandingNav } from "@/components/landing-nav";

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      <LandingNav />
      <ScrollVideoHero src="/videos/intro.mp4" />
    </main>
  );
}
