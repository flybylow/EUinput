import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            EUinput
          </h1>
          <p className="text-xl text-gray-600">
            European Consumer Transparency Study
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Help Shape the Future of Product Transparency
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            We're building digital product passports for Europe. Before we build, 
            we want to hear from you.
          </p>
          <Link
            href="/research"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Start 3-Minute Interview →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="font-semibold mb-2">3 Minutes</h3>
            <p className="text-gray-600 text-sm">Quick voice conversation</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">❓</div>
            <h3 className="font-semibold mb-2">5 Questions</h3>
            <p className="text-gray-600 text-sm">About product trust</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-semibold mb-2">Get Results</h3>
            <p className="text-gray-600 text-sm">Receive the final report</p>
          </div>
        </div>

        <div className="border-t pt-8 text-center">
          <p className="text-sm text-gray-500">
            A research project by{" "}
            <a href="https://tabulas.eu" className="text-blue-600 hover:underline">
              Tabulas
            </a>{" "}
            in collaboration with Howest and Thomas More
          </p>
        </div>
      </section>
    </main>
  );
}

