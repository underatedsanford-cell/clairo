import LeadsSheetPreview from "./components/LeadsSheetPreview";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero 
        title="Transform Your Sales with AI"
        description="Leverage cutting-edge AI to automate lead generation, personalize outreach, and close deals faster than ever before."
        buttonText="Get Started Today"
        buttonLink="/demo"
      />
      <LeadsSheetPreview />
    </main>
  );
}