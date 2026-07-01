import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { MapBreak } from "@/components/sections/MapBreak";
import { DashboardScreen } from "@/components/sections/DashboardScreen";
import { PlannerScreen } from "@/components/sections/PlannerScreen";
import { GoalsScreen } from "@/components/sections/GoalsScreen";
import { BudgetScreen } from "@/components/sections/BudgetScreen";
import { InvestmentsScreen } from "@/components/sections/InvestmentsScreen";
import { HealthScreen } from "@/components/sections/HealthScreen";
import { TrustPrinciples } from "@/components/sections/Trust";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <SmoothScroll>
      <Header />
      <main>
        <Hero />
        <MapBreak />
        <DashboardScreen />
        <PlannerScreen />
        <GoalsScreen />
        <BudgetScreen />
        <InvestmentsScreen />
        <HealthScreen />
        <TrustPrinciples />
        <CTA />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
