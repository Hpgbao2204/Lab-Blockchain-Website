import { Hero } from "@/components/hero/hero";
import { Ticker } from "@/components/sections/ticker";
import { Research } from "@/components/sections/research";
import { Pioneers } from "@/components/sections/pioneers";
import { Publications } from "@/components/sections/publications";
import { Join } from "@/components/sections/join";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Ticker />
        <Research />
        <Pioneers />
        <Publications />
        <Join />
      </main>
      <Footer />
    </>
  );
}
