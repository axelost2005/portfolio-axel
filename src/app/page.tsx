import Hero from "@/components/Hero";
import StackMarquee from "@/components/StackMarquee";
import About from "@/components/About";
import Services from "@/components/Services";
import Projects from "@/components/Projects";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div style={{ background: "#0C0C0C", color: "#D7E2EA", width: "100%" }}>
      <Hero />
      <StackMarquee />
      <About />
      <Services />
      <Projects />
      <Footer />
    </div>
  );
}
