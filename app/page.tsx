import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-gradient text-white relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl animate-fadeIn">
            <div className="inline-block mb-6 px-4 py-2 border border-white/30 backdrop-blur-sm">
              <span className="text-sm font-medium tracking-widest uppercase">Premium Golf Trip Management</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Elevate Your
              <br />
              Golf Experience
            </h1>

            <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed max-w-2xl">
              The refined platform for organizing unforgettable multi-day golf trips.
              Manage itineraries, track scores, and celebrate victories with style.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn delay-200">
              <Link
                href="/sign-up"
                className="btn-gold text-center"
              >
                Start Your Journey
              </Link>
              <Link
                href="/sign-in"
                className="btn-secondary bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-[#0d3321] text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative golf ball pattern */}
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 opacity-10">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="100" cy="100" r="3" fill="white" />
            <circle cx="85" cy="85" r="3" fill="white" />
            <circle cx="115" cy="85" r="3" fill="white" />
            <circle cx="85" cy="115" r="3" fill="white" />
            <circle cx="115" cy="115" r="3" fill="white" />
            <circle cx="70" cy="100" r="3" fill="white" />
            <circle cx="130" cy="100" r="3" fill="white" />
            <circle cx="100" cy="70" r="3" fill="white" />
            <circle cx="100" cy="130" r="3" fill="white" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="badge badge-gold">Features</span>
            </div>
            <h2 className="magazine-header mb-4">Everything You Need</h2>
            <div className="w-24 h-1 bg-[#d4af37] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "⛳",
                title: "Trip Planning",
                description: "Create detailed itineraries with rounds, dining, lodging, and activities for your entire golf getaway."
              },
              {
                icon: "🏌️",
                title: "Tee Sheets",
                description: "Organize players into tee groups with precise tee times and starting holes for seamless play."
              },
              {
                icon: "📊",
                title: "Live Scoring",
                description: "Track hole-by-hole scores with automatic handicap calculations and real-time leaderboard updates."
              },
              {
                icon: "🏆",
                title: "Leaderboards",
                description: "View round-specific and cumulative leaderboards with both gross and net score rankings."
              },
              {
                icon: "💳",
                title: "Payment Collection",
                description: "Securely collect deposits and fees through integrated Stripe checkout with status tracking."
              },
              {
                icon: "📢",
                title: "Announcements",
                description: "Keep everyone informed with trip-wide announcements and important updates in one place."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="card-elegant p-8 animate-fadeInScale"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-serif font-bold text-[#0d3321] mb-3">{feature.title}</h3>
                <p className="text-[#6b7280] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="badge badge-green">Process</span>
            </div>
            <h2 className="magazine-header mb-4">From Planning to Par</h2>
            <div className="w-24 h-1 bg-[#1a4d2e] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create & Invite",
                description: "Set up your golf trip with dates, locations, and course details. Invite your group and track RSVPs effortlessly."
              },
              {
                step: "02",
                title: "Organize & Schedule",
                description: "Build your itinerary, arrange tee times, create pairings, and manage payments all from one elegant dashboard."
              },
              {
                step: "03",
                title: "Play & Compete",
                description: "Track scores in real-time, watch the leaderboard update, and celebrate achievements throughout your trip."
              }
            ].map((step, index) => (
              <div key={index} className="relative animate-slideInLeft" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="font-serif text-6xl font-bold text-[#d4af37] opacity-20 mb-4">{step.step}</div>
                <h3 className="text-2xl font-serif font-bold text-[#0d3321] mb-4">{step.title}</h3>
                <div className="divider-gold mb-4"></div>
                <p className="text-[#6b7280] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-[#0d3321] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="golf-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#golf-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Ready to Plan Your Next Round?
          </h2>
          <p className="text-xl mb-10 text-white/80 max-w-2xl mx-auto">
            Join golf enthusiasts who trust Fairway Planner to create memorable trips and lasting friendships.
          </p>
          <Link
            href="/sign-up"
            className="btn-gold inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#1a4d2e]/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#0d3321] mb-2">Fairway Planner</h3>
              <p className="text-sm text-[#6b7280]">Elevating golf trip management</p>
            </div>

            <div className="flex gap-8 text-sm text-[#6b7280]">
              <Link href="/sign-in" className="hover:text-[#1a4d2e] transition-colors">Sign In</Link>
              <Link href="/sign-up" className="hover:text-[#1a4d2e] transition-colors">Sign Up</Link>
            </div>
          </div>

          <div className="divider-gold my-8"></div>

          <div className="text-center text-sm text-[#6b7280]">
            © 2026 Fairway Planner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
