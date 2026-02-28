"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import {
  BanknotesIcon,
  ClockIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  CheckIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  TruckIcon,
  BuildingStorefrontIcon,
  HeartIcon,
  ComputerDesktopIcon,
  CogIcon,
  WrenchIcon,
  ScissorsIcon,
} from "@heroicons/react/24/outline";

// ─── Animated Counter ─────────────────────────────────────────
function Counter({
  target,
  prefix = "",
  suffix = "",
  duration = 2,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Section Reveal Wrapper ───────────────────────────────────
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger Children ─────────────────────────────────────────
function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Parallax for hero — use scrollY in pixels for consistent behavior
  const heroY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Nav background on scroll
  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavScrolled(latest > 50);
  });

  const navLinks = [
    { href: "#programs", label: "Programs" },
    { href: "#why-us", label: "Why Us" },
    { href: "#process", label: "Process" },
    { href: "#industries", label: "Industries" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ─────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-black/5 border-b border-card-border"
            : "bg-[#0a2322]/90 backdrop-blur-sm border-b border-white/10"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <motion.a
            href="#"
            className="shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image
              src="/logo.png"
              alt="Wholesale Funding Solutions"
              width={180}
              height={45}
              className={`h-18 w-auto transition-all duration-300 ${
                navScrolled ? "" : "brightness-0 invert"
              }`}
              priority
            />
          </motion.a>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`nav-link text-md font-medium transition-colors ${
                  navScrolled
                    ? "text-muted hover:text-accent"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
            <motion.a
              href="/apply"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-accent px-6 py-2.5 text-md font-semibold text-white transition-all glow-accent"
            >
              APPLY NOW
            </motion.a>
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`md:hidden p-2 rounded-lg transition ${
              navScrolled
                ? "text-foreground hover:bg-card-bg"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile Menu ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-card-border">
                <Image
                  src="/logo.png"
                  alt="WFS"
                  width={140}
                  height={35}
                  className="h-9 w-auto"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-card-bg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-foreground hover:bg-accent-light hover:text-accent transition"
                  >
                    {link.label}
                  </motion.a>
                ))}
                <motion.a
                  href="/apply"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="block mt-4 rounded-lg bg-accent px-4 py-3 text-center text-base font-bold text-white"
                >
                  APPLY NOW
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-hero-bg px-6 pt-20"
      >
        {/* Animated grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-[15%] h-72 w-72 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-[10%] h-96 w-96 rounded-full bg-accent/8 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent"
          >
            Direct Business Capital
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mx-auto max-w-4xl font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl"
          >
            No Brokers. No Delays.
            <br />
            <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
              Just Capital.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-300/90"
          >
            When your business needs capital, you don&rsquo;t need a middleman.
            You need execution. Wholesale Funding Solutions provides fast, direct
            access to working capital for serious business owners ready to move.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <motion.a
              href="/apply"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative rounded-lg bg-accent px-10 py-4 text-base font-bold text-white transition-all glow-accent"
            >
              <span className="relative z-10 flex items-center gap-2">
                APPLY NOW
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.a>
            <motion.a
              href="/apply"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg border-2 border-accent px-10 py-4 text-base font-bold text-accent backdrop-blur-sm transition-all hover:bg-accent hover:text-white"
            >
              GET APPROVED TODAY
            </motion.a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="mx-auto mt-20 flex max-w-2xl flex-wrap items-center justify-center gap-8 sm:gap-16"
          >
            {[
              { value: 750, prefix: "$", suffix: "K+", label: "Max Funding" },
              { value: 24, suffix: "HR", label: "Avg Approval" },
              { value: 98, suffix: "%", label: "Approval Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-accent">
                  <Counter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <a href="#about" className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDownIcon className="h-5 w-5 animate-scroll-bounce" />
          </a>
        </motion.div>
      </section>

      {/* ── Direct Provider ────────────────────────────────── */}
      <section id="about" className="relative py-28 px-6">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="font-serif text-3xl font-bold sm:text-5xl">
              We Fund Businesses.{" "}
              <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                Period.
              </span>
            </h2>
          </Reveal>

          <StaggerContainer className="mx-auto mt-10 max-w-lg space-y-3">
            {[
              "We are not a referral service.",
              "We are not a marketplace.",
              'We are not here to "shop your file."',
            ].map((text) => (
              <StaggerItem key={text}>
                <p className="text-lg text-muted">{text}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-10 max-w-2xl text-lg leading-relaxed">
              We are a{" "}
              <span className="font-semibold text-accent">
                direct capital provider
              </span>{" "}
              making real underwriting decisions in real time. If your business
              produces revenue, we can structure capital quickly &mdash; often
              within hours.
            </p>
          </Reveal>

          <StaggerContainer className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {[
              { text: "Same-day approvals", icon: ClockIcon },
              { text: "Funding in 24\u201348 hours", icon: BanknotesIcon },
              { text: "Revenue-based underwriting", icon: ChartBarIcon },
              { text: "No unnecessary documentation", icon: DocumentCheckIcon },
              { text: "No upfront costs", icon: ShieldCheckIcon },
            ].map((item) => (
              <StaggerItem key={item.text}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 rounded-lg border border-card-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-light">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Reveal delay={0.3}>
            <p className="mt-16 font-serif text-2xl font-semibold">
              You run your business.{" "}
              <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                We provide the capital.
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Capital Programs ───────────────────────────────── */}
      <section id="programs" className="bg-card-bg py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Our Solutions
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">
                Capital Programs Built for{" "}
                <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                  Speed
                </span>
              </h2>
            </div>
          </Reveal>

          <StaggerContainer className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <ProgramCard
                icon={CurrencyDollarIcon}
                title="Revenue-Based Working Capital"
                description="Fast, straightforward capital based on business performance."
                items={[
                  "$5,000 \u2013 $750,000+",
                  "Daily or weekly structures",
                  "Short terms",
                  "Built for immediate execution",
                ]}
                accent="from-accent to-[#4ecdc4]"
              />
            </StaggerItem>
            <StaggerItem>
              <ProgramCard
                icon={ChartBarIcon}
                title="Structured Term Financing"
                description="Larger capital solutions with fixed payments."
                items={[
                  "6\u201324 month terms",
                  "Higher funding amounts",
                  "Expansion & growth focused",
                  "Designed for scaling operators",
                ]}
                accent="from-[#4ecdc4] to-accent"
              />
            </StaggerItem>
            <StaggerItem>
              <ProgramCard
                icon={WrenchScrewdriverIcon}
                title="Equipment Financing"
                description="Secure the tools that drive revenue."
                items={[
                  "Up to 100% financing",
                  "Preserve cash flow",
                  "Quick approvals",
                  "All major industries considered",
                ]}
                accent="from-accent to-[#2dd4bf]"
              />
            </StaggerItem>
            <StaggerItem>
              <ProgramCard
                icon={ArrowPathIcon}
                title="Business Line of Credit"
                description="Capital on standby when timing matters."
                items={[
                  "Draw when needed",
                  "Revolving flexibility",
                  "Only pay for what you use",
                ]}
                accent="from-[#2dd4bf] to-accent"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ── Why Us ─────────────────────────────────────────── */}
      <section id="why-us" className="py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                The Difference
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">
                Why Wholesale Funding Solutions{" "}
                <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                  Wins
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Reveal delay={0.1}>
              <ComparisonCard
                label="Banks"
                description="Weeks of paperwork. Committee approvals. Rigid requirements."
                verdict="Move slowly."
                negative
              />
            </Reveal>
            <Reveal delay={0.2}>
              <ComparisonCard
                label="Brokers"
                description="Shop your file around. No control. No transparency."
                verdict="Move files around."
                negative
              />
            </Reveal>
            <Reveal delay={0.3}>
              <ComparisonCard
                label="WFS"
                description="Direct underwriting. Same-day decisions. Real execution."
                verdict="We move capital."
                negative={false}
              />
            </Reveal>
          </div>

          <Reveal delay={0.3}>
            <p className="mx-auto mt-16 max-w-2xl text-center text-lg text-muted leading-relaxed">
              Our underwriting team evaluates performance, cash flow, and
              trajectory &mdash; not just a credit score from three years ago. If
              your business is producing, we&rsquo;re interested.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Process ────────────────────────────────────────── */}
      <section id="process" className="bg-card-bg py-28 px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                How It Works
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">
                The Process Is{" "}
                <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                  Simple
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="relative mt-20">
            {/* Connection line */}
            <div className="absolute top-12 left-0 right-0 hidden h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent sm:block" />

            <StaggerContainer className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
              <StaggerItem>
                <ProcessStep
                  step="01"
                  title="Apply"
                  description="Short application. Basic revenue documentation. Takes under 10 minutes."
                  icon={DocumentCheckIcon}
                />
              </StaggerItem>
              <StaggerItem>
                <ProcessStep
                  step="02"
                  title="Underwriting"
                  description="Real review. Real decision. Typically same day. No runaround."
                  icon={ShieldCheckIcon}
                />
              </StaggerItem>
              <StaggerItem>
                <ProcessStep
                  step="03"
                  title="Funding"
                  description="Execute documents. Funds sent directly to your business account."
                  icon={BanknotesIcon}
                />
              </StaggerItem>
            </StaggerContainer>
          </div>

          <Reveal delay={0.3}>
            <p className="mt-16 text-center text-lg text-muted">
              No endless back-and-forth. No uncertainty.{" "}
              <span className="font-semibold text-accent">Just results.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Industries ─────────────────────────────────────── */}
      <section id="industries" className="py-28 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Who We Serve
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">
              We Work With{" "}
              <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                Operators
              </span>
            </h2>
          </Reveal>

          <StaggerContainer className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { name: "Retail", icon: BuildingStorefrontIcon },
              { name: "Construction", icon: WrenchIcon },
              { name: "Restaurants", icon: ScissorsIcon },
              { name: "Medical", icon: HeartIcon },
              { name: "Transportation", icon: TruckIcon },
              { name: "Professional Services", icon: BuildingOffice2Icon },
              { name: "E-commerce", icon: ComputerDesktopIcon },
              { name: "Manufacturing", icon: CogIcon },
            ].map((industry) => (
              <StaggerItem key={industry.name}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-card-border bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:border-accent/30"
                >
                  <industry.icon className="h-7 w-7 text-muted transition-colors group-hover:text-accent" />
                  <span className="text-sm font-medium">{industry.name}</span>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Reveal delay={0.2}>
            <p className="mt-12 text-lg text-muted">
              If you generate consistent monthly revenue, we can likely structure
              capital.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Stop Waiting ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-bg py-28 px-6 text-white">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <motion.div
          className="absolute top-1/3 right-[5%] h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="font-serif text-3xl font-bold sm:text-5xl">
              Stop Waiting on{" "}
              <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                Banks
              </span>
            </h2>
            <p className="mt-6 text-lg text-gray-300">
              Opportunities don&rsquo;t pause while you wait for underwriting
              committees.
            </p>
          </Reveal>

          <StaggerContainer className="mx-auto mt-10 flex max-w-lg flex-wrap justify-center gap-3">
            {[
              "Inventory deals",
              "Expansion",
              "Marketing campaigns",
              "Bridge capital",
              "Payroll gaps",
            ].map((use) => (
              <StaggerItem key={use}>
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  className="inline-block rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm font-medium text-accent backdrop-blur-sm"
                >
                  {use}
                </motion.span>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Reveal delay={0.3}>
            <p className="mt-14 text-xl font-semibold">
              Wholesale Funding Solutions helps you{" "}
              <span className="text-accent">move now</span>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-card-border bg-gradient-to-br from-white to-accent-light p-12 text-center shadow-xl sm:p-16">
            <h2 className="font-serif text-3xl font-bold sm:text-5xl">
              Ready to{" "}
              <span className="bg-gradient-to-r from-accent to-[#4ecdc4] bg-clip-text text-transparent">
                Move
              </span>
              ?
            </h2>
            <p className="mt-6 text-lg text-muted">
              If you&rsquo;re serious about capital, we&rsquo;re serious about
              funding. Submit your application today and receive real options
              within hours.
            </p>
            <p className="mt-4 font-semibold text-accent">
              Direct capital. Fast execution. Wholesale structure.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.a
                href="/apply"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group rounded-lg bg-accent px-10 py-4 text-base font-bold text-white transition-all glow-accent"
              >
                <span className="flex items-center gap-2">
                  START YOUR APPLICATION
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.a>
              <motion.a
                href="/apply"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg border border-accent px-10 py-4 text-base font-bold text-accent transition-all hover:bg-accent/5"
              >
                SPEAK TO A SPECIALIST
              </motion.a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-card-border bg-hero-bg py-14 px-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <Image
                src="/logo.png"
                alt="Wholesale Funding Solutions"
                width={160}
                height={40}
                className="mx-auto h-18 w-auto brightness-0 invert sm:mx-0"
              />
              <p className="mt-3 text-sm text-gray-400">
                203 North LaSalle Street, Chicago, IL 60601
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-accent"
                >
                  {link.label}
                </a>
              ))}
              <a href="/apply" className="transition hover:text-accent">
                Apply
              </a>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-8 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Wholesale Funding Solutions. All
            rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Program Card Component ───────────────────────────────────
function ProgramCard({
  icon: Icon,
  title,
  description,
  items,
  accent,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  items: string[];
  accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-card-border bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
    >
      {/* Top gradient accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light transition-colors group-hover:bg-accent/20">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Comparison Card ──────────────────────────────────────────
function ComparisonCard({
  label,
  description,
  verdict,
  negative,
}: {
  label: string;
  description: string;
  verdict: string;
  negative: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-xl border p-8 text-center transition-shadow hover:shadow-xl ${
        negative
          ? "border-card-border bg-white"
          : "border-accent/30 bg-gradient-to-br from-accent-light to-white shadow-lg"
      }`}
    >
      {!negative && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-[#4ecdc4]" />
      )}
      <h3
        className={`font-serif text-xl font-bold ${negative ? "text-muted" : "text-accent"}`}
      >
        {label}
      </h3>
      <p className="mt-3 text-sm text-muted">{description}</p>
      <p
        className={`mt-5 text-lg font-semibold ${
          negative ? "text-foreground/60" : "text-accent"
        }`}
      >
        {verdict}
      </p>
    </motion.div>
  );
}

// ─── Process Step ─────────────────────────────────────────────
function ProcessStep({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="relative text-center">
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-lg border border-card-border"
      >
        <Icon className="h-10 w-10 text-accent" />
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shadow-md">
          {step}
        </span>
      </motion.div>
      <h3 className="mt-6 font-serif text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
