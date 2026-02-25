import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar activePage="/about" />

      <div className="h-16" />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
          About ArtEcho
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-500 md:text-lg">
          ArtEcho is where human creativity meets artificial intelligence. We
          believe every artist has a unique voice — and AI should amplify it,
          not replace it.
        </p>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Our Mission
            </h2>
            <p className="mt-4 text-sm text-zinc-500 leading-7">
              We&apos;re building a platform where artists learn, create, and
              teach AI their personal style. Through a continuous feedback loop
              of Learn &rarr; Teach &rarr; Test &rarr; Notify, both the artist
              and the AI grow together.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              How It Works
            </h2>
            <p className="mt-4 text-sm text-zinc-500 leading-7">
              Start with curated drawing lessons to build your skills. Upload
              your artwork so ArtEcho learns your unique patterns. Test the
              AI&apos;s understanding and refine its output — creating a true
              symbiotic creative relationship.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
          What We Believe
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "Art First", desc: "Technology serves the artist, never the other way around." },
            { title: "Always Learning", desc: "Both you and the AI evolve with every interaction." },
            { title: "Your Style, Your Own", desc: "Your creative identity is unique and should be preserved." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-6 text-center">
              <h3 className="text-lg font-semibold text-zinc-900">{v.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <p className="text-sm text-zinc-400 italic">
          Why creators and educators love it
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl italic">
          A gentle playground for learning how AI training works
        </h2>
        <p className="mt-4 max-w-3xl text-sm text-zinc-500 leading-7">
          ArtEcho keeps things visual and friendly while quietly preparing clean
          data for future fine-tuning on platforms like Hugging Face or
          Replicate.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
              ),
              title: "Levelled growth journey",
              desc: "Your AI kid moves through four school-inspired levels: Kindergarten, Elementary School, Middle School, and High School. Each tier unlocks new messages and visual milestones so progress always feels tangible.",
              bullets: [
                "Kindergarten: playful scribbles and color exploration",
                "Elementary School: cleaner lines and simple characters",
                "Middle School: composition, shading, and more detail",
                "High School: confident, concept-driven artwork",
              ],
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              ),
              title: "Train your AI kid with uploads",
              desc: "Drag in images and short videos of your drawing process. We store them as structured training uploads, ready for future experiments with custom AI models.",
              bullets: [
                "Support for images, videos, and other creative files",
                "Each upload is tagged with type and timestamp",
                "Simple list view on your dashboard for easy review",
              ],
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              ),
              title: "Future marketplace-ready",
              desc: "Imagine a simple marketplace where creators list their trained AI kids. ArtEcho includes a placeholder marketplace page to showcase model cards, levels, and statuses.",
              bullets: [
                "Model cards with level badges and status labels",
                "Opt-in listing flow once your AI kid feels ready",
                "No payments yet\u2014just imagination and planning",
              ],
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                </svg>
              ),
              title: "Hooks for future fine-tuning",
              desc: "Behind the scenes, your uploads can be grouped into \u201Ctraining jobs\u201D\u2014batches that describe which files you would use to fine-tune an AI model later.",
              bullets: [
                "Create pretend training batches from selected uploads",
                "Track job status from Pending to Completed",
                "Reserve space for future external model IDs",
              ],
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              title: "Perfect for classrooms & clubs",
              desc: "Walk students, art club members, or your own kids through a concrete example of how AI learns, without touching any code.",
              bullets: [
                "Simple dashboards show progress at a glance",
                "Admin view (coming soon) to monitor learners\u2019 growth",
                "Kid-friendly visuals with a calm, modern feel",
              ],
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              ),
              title: "Thoughtful admin tools",
              desc: "An admin dashboard provides an overview of users, uploads, marketplace listings, and training jobs so you can monitor engagement and plan improvements.",
              bullets: [
                "See user progress and current AI kid levels",
                "Review uploads and marketplace activity",
                "Simulate training job status changes for demos",
              ],
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-6"
            >
              <div className="flex items-center gap-2 text-zinc-700 mb-3">
                {feature.icon}
                <h3 className="text-base font-semibold text-zinc-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {feature.desc}
              </p>
              <ul className="mt-4 space-y-1.5">
                {feature.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed"
                  >
                    <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
