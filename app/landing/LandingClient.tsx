"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Star,
  Check,
  QrCode,
  Gift,
  Heart,
  Menu,
  X,
  Smartphone,
  BarChart3,
  Bell,
  Shield,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";

/* ═══════ FAQ ═══════ */
const faqItems = [
  {
    q: "Mes clients doivent télécharger une application ?",
    a: "Non. Izou fonctionne directement dans le navigateur. Vos clients peuvent ajouter leur carte sur l'écran d'accueil ou dans Apple Wallet.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "5 minutes. Créez votre compte, personnalisez votre carte, et vos clients commencent à collecter dès aujourd'hui.",
  },
  {
    q: "Comment ça marche en boutique ?",
    a: "Un QR code à scanner à chaque passage. 2 secondes, sans contact, mise à jour en temps réel.",
  },
  {
    q: "Je peux personnaliser les récompenses ?",
    a: "Oui. Tampons ou points, nombre de passages, type de récompense — vous décidez de tout.",
  },
  {
    q: "C'est adapté à quel type de commerce ?",
    a: "Boulangeries, cafés, salons de coiffure, restaurants, boutiques… Tous les commerces de proximité.",
  },
  {
    q: "Comment fonctionne le tableau de bord ?",
    a: "Un dashboard en temps réel vous montre vos clients fidèles, fréquences de visites, tendances et KPIs — accessible depuis votre téléphone.",
  },
];

/* ═══════ PHONE MOCKUP ═══════ */
function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative rounded-[40px] bg-[#111] p-[6px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        {/* Notch */}
        <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#111] rounded-b-[16px] z-20" />
        <div className="rounded-[34px] overflow-hidden bg-white">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN
   ═══════════════════════════════════════ */
export default function LandingClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const f = "font-[var(--font-jakarta)]";

  return (
    <div className={`min-h-screen bg-white text-[#111] overflow-x-hidden ${f}`}>
      {/* ──── NAV ──── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight">izou</span>
          </Link>

          <div className="hidden md:flex items-center">
            <div className="flex items-center bg-gray-50 rounded-full px-1 py-1 gap-1 text-[13px] font-medium">
              <a href="#fonctionnalites" className="px-4 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-[#111]">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="px-4 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-[#111]">
                Tarifs
              </a>
              <a href="#temoignages" className="px-4 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-[#111]">
                Témoignages
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/login"
              className="hidden sm:inline text-[13px] font-semibold text-gray-500 hover:text-[#111] transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/dashboard/register"
              className="bg-[#111] text-white pl-5 pr-4 py-2.5 rounded-full text-[13px] font-semibold hover:bg-[#333] transition-colors flex items-center gap-1.5"
            >
              Commencer
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden" aria-label="Menu">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-5 space-y-3">
            {["Fonctionnalités", "Tarifs", "Témoignages"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                className="block text-sm text-gray-500 font-medium"
                onClick={() => setMobileMenu(false)}
              >
                {l}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="pt-[120px] pb-16 sm:pt-[140px] sm:pb-24 bg-gradient-to-b from-indigo-50/60 via-white to-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          {/* Social proof */}
          <div className="flex items-center gap-3 justify-center mb-10">
            <div className="flex -space-x-2">
              {["bg-indigo-500", "bg-amber-400", "bg-rose-500", "bg-emerald-400"].map((c, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${c} border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {["S", "K", "M", "L"][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[13px] font-semibold text-gray-400 ml-1">4.9</span>
            </div>
            <span className="text-[13px] text-gray-400">200+ commerçants</span>
          </div>

          {/* Giant headline */}
          <div className="text-center">
            <h1 className="text-[clamp(2.5rem,8vw,6.5rem)] font-[900] leading-[0.95] tracking-[-0.03em] text-[#111]">
              FIDÉLISEZ
              <br />
              <span className="text-[#4F46E5]">VOS CLIENTS</span>
            </h1>

            <p className="mt-6 text-[15px] sm:text-[17px] text-gray-500 max-w-[480px] mx-auto leading-relaxed">
              Le programme de fidélité digital pensé pour les commerçants.
              Carte sur smartphone, zéro application à télécharger.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/register"
                className="bg-[#4F46E5] text-white px-7 py-3.5 rounded-full text-[15px] font-bold hover:bg-[#4338CA] transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#fonctionnalites"
                className="text-[15px] font-semibold text-gray-400 hover:text-[#111] transition-colors flex items-center gap-1.5"
              >
                Découvrir les fonctionnalités
              </a>
            </div>
          </div>

          {/* Phone mockup hero */}
          <div className="mt-16 flex justify-center relative">
            {/* Floating labels */}
            <div className="absolute left-[5%] sm:left-[15%] top-12 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-3.5 flex items-center gap-3 z-10 hidden sm:flex">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[12px] font-bold">+1 tampon</p>
                <p className="text-[10px] text-gray-400">Léa vient de passer</p>
              </div>
            </div>

            <div className="absolute right-[5%] sm:right-[15%] top-32 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-3.5 flex items-center gap-3 z-10 hidden sm:flex">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[12px] font-bold">+18% ce mois</p>
                <p className="text-[10px] text-gray-400">Visites en hausse</p>
              </div>
            </div>

            <PhoneMockup className="w-[280px]">
              <div className="h-[560px] bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 pt-10 px-5 pb-5 flex flex-col">
                <p className="text-[11px] text-amber-800/50 font-medium">Carte de fidélité</p>
                <p className="text-[18px] font-extrabold text-[#111] mt-0.5 leading-tight">
                  Boulangerie
                  <br />
                  Les Délices
                </p>
                <p className="text-[10px] text-amber-800/50 mt-1 mb-5">
                  Encore 2 tampons pour un croissant offert
                </p>

                {/* Stamps */}
                <div className="bg-white/30 backdrop-blur rounded-2xl p-3.5 mb-4">
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-xl flex items-center justify-center ${
                          i < 8
                            ? "bg-[#111] shadow-md"
                            : i === 9
                              ? "border-2 border-dashed border-amber-700/25 bg-white/20"
                              : "border-2 border-dashed border-amber-700/15 bg-white/10"
                        }`}
                      >
                        {i < 8 ? (
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                        ) : i === 9 ? (
                          <Gift className="w-3 h-3 text-amber-700/30" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-[9px] text-amber-900/40 mt-2 font-semibold">
                    8 / 10 tampons
                  </p>
                </div>

                {/* Reward */}
                <div className="bg-[#111] rounded-2xl p-4 flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-white">Croissant offert</p>
                    <p className="text-[9px] text-white/40">Votre prochaine récompense</p>
                  </div>
                </div>

                <div className="mt-auto bg-[#111] rounded-2xl py-3.5 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-white/50" />
                  <span className="text-[11px] text-white/50 font-semibold">Présenter en caisse</span>
                </div>
              </div>
            </PhoneMockup>
          </div>
        </div>
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section className="py-16 border-y border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: "200+", label: "Commerçants actifs" },
              { val: "15k+", label: "Clients fidélisés" },
              { val: "5 min", label: "Mise en place" },
              { val: "98%", label: "Satisfaction" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[2.5rem] sm:text-[3rem] font-[900] tracking-tight leading-none">
                  {s.val}
                </p>
                <p className="text-[13px] text-gray-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURE BENTO ══════════ */}
      <section id="fonctionnalites" className="py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-[#4F46E5] text-[13px] font-bold uppercase tracking-widest mb-3">
              Fonctionnalités
            </p>
            <h2 className="text-[2rem] sm:text-[2.75rem] font-[900] tracking-tight leading-[1.1]">
              Tout ce dont vous avez besoin
              <br className="hidden sm:block" />
              <span className="text-gray-300">pour fidéliser vos clients.</span>
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 — big: Loyalty card */}
            <div className="bg-gray-50 rounded-3xl p-8 flex flex-col min-h-[380px] relative overflow-hidden group">
              <div>
                <h3 className="text-[20px] font-extrabold mb-2">Carte de fidélité digitale</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed max-w-[300px]">
                  Vos clients ont leur carte sur smartphone. Zéro papier, zéro oubli.
                </p>
              </div>
              {/* Mini card mockup */}
              <div className="mt-auto pt-6 flex justify-center">
                <div className="w-[240px] bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-4 shadow-lg group-hover:-translate-y-1 transition-transform">
                  <p className="text-[11px] font-bold text-amber-900/70">Boulangerie Les Délices</p>
                  <div className="grid grid-cols-5 gap-1.5 mt-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[8px] ${
                          i < 7 ? "bg-[#111]" : "bg-white/30"
                        }`}
                      >
                        {i < 7 && <Check className="w-2.5 h-2.5 text-amber-400" />}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-amber-900/50 text-center mt-2">7/10 tampons</p>
                </div>
              </div>
            </div>

            {/* Card 2 — Dashboard */}
            <div className="bg-gray-50 rounded-3xl p-8 flex flex-col min-h-[380px] relative overflow-hidden group">
              <div>
                <h3 className="text-[20px] font-extrabold mb-2">Tableau de bord en temps réel</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed max-w-[300px]">
                  Vos KPIs, clients fidèles et tendances en un coup d&apos;œil.
                </p>
              </div>
              {/* Mini dashboard */}
              <div className="mt-auto pt-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 group-hover:-translate-y-1 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-bold text-gray-400">Visites cette semaine</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+18%</p>
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[35, 55, 45, 70, 50, 85, 65].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-md transition-all ${
                          i === 5
                            ? "bg-[#4F46E5]"
                            : "bg-gray-100"
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[8px] text-gray-300 font-medium">
                    <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — Scan QR */}
            <div className="bg-gray-50 rounded-3xl p-8 flex flex-col min-h-[300px] group">
              <div>
                <h3 className="text-[20px] font-extrabold mb-2">Scan QR instantané</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed max-w-[300px]">
                  2 secondes par passage. Simple pour vous, magique pour vos clients.
                </p>
              </div>
              <div className="mt-auto pt-6 flex items-center gap-4">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                  <QrCode className="w-12 h-12 text-[#4F46E5]" />
                </div>
                <div className="space-y-2">
                  {["Sans contact", "Temps réel", "2 secondes"].map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-500">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 4 — Notifications */}
            <div className="bg-gray-50 rounded-3xl p-8 flex flex-col min-h-[300px] group">
              <div>
                <h3 className="text-[20px] font-extrabold mb-2">Notifications push</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed max-w-[300px]">
                  Rappelez vos clients au bon moment, sans être intrusif.
                </p>
              </div>
              <div className="mt-auto pt-6 space-y-2.5">
                {[
                  { msg: "Plus qu'un tampon pour votre croissant !", time: "Il y a 2h", dot: "bg-[#4F46E5]" },
                  { msg: "Bienvenue chez Les Délices ! 🥐", time: "Hier", dot: "bg-amber-400" },
                  { msg: "Votre récompense vous attend !", time: "Lundi", dot: "bg-emerald-400" },
                ].map((n) => (
                  <div
                    key={n.msg}
                    className="bg-white rounded-xl p-3.5 flex items-start gap-3 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${n.dot} mt-1 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#111] truncate">{n.msg}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Small feature pills */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Gift, label: "Récompenses sur-mesure" },
              { icon: Shield, label: "RGPD & sécurisé" },
              { icon: Smartphone, label: "Apple Wallet" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-gray-50 rounded-2xl px-6 py-5 flex items-center gap-3"
              >
                <Icon className="w-5 h-5 text-[#4F46E5]" />
                <span className="text-[14px] font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-24 sm:py-32 border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-[#4F46E5] text-[13px] font-bold uppercase tracking-widest mb-3">
              Comment ça marche
            </p>
            <h2 className="text-[2rem] sm:text-[2.75rem] font-[900] tracking-tight leading-[1.1]">
              3 étapes simples
              <br className="hidden sm:block" />
              <span className="text-gray-300">pour fidéliser autrement.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                num: "01",
                title: "Créez votre programme",
                desc: "Inscrivez-vous, personnalisez votre carte de fidélité avec vos couleurs et votre récompense.",
                iconBg: "bg-indigo-100",
                iconColor: "text-[#4F46E5]",
              },
              {
                icon: QrCode,
                num: "02",
                title: "Affichez votre QR code",
                desc: "Imprimez-le ou affichez-le en boutique. Vos clients scannent pour rejoindre le programme.",
                iconBg: "bg-rose-100",
                iconColor: "text-rose-500",
              },
              {
                icon: TrendingUp,
                num: "03",
                title: "Fidélisez & analysez",
                desc: "Chaque visite compte. Récompensez vos meilleurs clients et suivez vos statistiques.",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
              },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className={`w-14 h-14 ${s.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <h3 className="text-[18px] font-extrabold mb-2">{s.title}</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BIG CTA + PHONE SECTION (like Upwize blue) ══════════ */}
      <section className="py-24 sm:py-32 bg-[#4F46E5] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.15),transparent_50%)]" />

        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-[2rem] sm:text-[2.75rem] font-[900] tracking-tight leading-[1.1]">
                Vos clients méritent
                <br />
                mieux qu&apos;une carte
                <br />
                en carton.
              </h2>
              <p className="mt-5 text-[15px] text-indigo-200 leading-relaxed max-w-[400px]">
                67% des consommateurs participent davantage aux programmes digitaux.
                Montrez à vos clients que vous êtes un commerce moderne et attentionné.
              </p>

              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  { icon: Users, label: "Tendances & insights" },
                  { icon: BarChart3, label: "Statistiques avancées" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[14px] font-bold">{label}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard/register"
                className="mt-8 inline-flex items-center gap-2 bg-white text-[#4F46E5] px-7 py-3.5 rounded-full font-bold text-[15px] hover:bg-indigo-50 transition-colors shadow-xl"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Phone with dashboard */}
            <div className="flex justify-center">
              <PhoneMockup className="w-[270px]">
                <div className="h-[540px] bg-[#FAFAFA] pt-10 px-4 pb-4">
                  <p className="text-[10px] text-gray-400 font-medium">Bonjour Sophie 👋</p>
                  <p className="text-[16px] font-extrabold text-[#111] mt-0.5 mb-4">Votre dashboard</p>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <Users className="w-3.5 h-3.5 text-[#4F46E5] mb-1" />
                      <p className="text-[14px] font-extrabold">247</p>
                      <p className="text-[8px] text-gray-400">Clients fidèles</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                      <p className="text-[14px] font-extrabold">+18%</p>
                      <p className="text-[8px] text-gray-400">Ce mois</p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-white rounded-xl p-3 border border-gray-100 mb-3">
                    <p className="text-[9px] font-bold text-gray-400 mb-2">Visites — 7 jours</p>
                    <div className="flex items-end gap-1 h-14">
                      {[30, 50, 40, 65, 45, 80, 60].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background: i === 5 ? "#4F46E5" : "#F3F4F6",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent */}
                  <p className="text-[9px] font-bold text-gray-400 mb-2">Derniers passages</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "Léa P.", action: "8e visite", c: "bg-amber-400" },
                      { name: "Hugo R.", action: "Récompense", c: "bg-rose-400" },
                      { name: "Inès M.", action: "Nouveau", c: "bg-emerald-400" },
                      { name: "Paul D.", action: "5e visite", c: "bg-indigo-400" },
                    ].map((a) => (
                      <div key={a.name} className="bg-white rounded-lg p-2.5 flex items-center gap-2 border border-gray-100">
                        <div className={`w-6 h-6 rounded-full ${a.c} flex items-center justify-center text-[8px] font-bold text-white`}>
                          {a.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold">{a.name}</p>
                          <p className="text-[8px] text-gray-400">{a.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section id="temoignages" className="py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-[#4F46E5] text-[13px] font-bold uppercase tracking-widest mb-3">
              Témoignages
            </p>
            <h2 className="text-[2rem] sm:text-[2.75rem] font-[900] tracking-tight leading-[1.1]">
              Ils fidélisent avec Izou.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Sophie M.",
                biz: "Boulangerie Les Délices",
                text: "Nos clients reviennent plus souvent. Le digital les amuse et nous, on gagne un temps fou. Plus besoin de gérer des cartes papier !",
              },
              {
                name: "Karim B.",
                biz: "Barber Shop K",
                text: "Le tableau de bord m'a ouvert les yeux. Je sais enfin quels jours sont les plus calmes et quand relancer mes clients. Un game changer.",
              },
              {
                name: "Marie-Claire D.",
                biz: "Boutique Chez Marie",
                text: "Moi qui ne suis pas tech, j'ai tout compris en 5 minutes. Mes clientes adorent et me demandent sans cesse quand elles auront leur tampon !",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-gray-50 rounded-2xl p-7 border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#4F46E5] flex items-center justify-center text-[12px] font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.biz}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="tarifs" className="py-24 sm:py-32 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-[#4F46E5] text-[13px] font-bold uppercase tracking-widest mb-3">
              Tarifs
            </p>
            <h2 className="text-[2rem] sm:text-[2.75rem] font-[900] tracking-tight leading-[1.1]">
              Des offres simples et transparentes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <p className="text-[14px] font-bold text-gray-400">Découverte</p>
              <p className="text-[13px] text-gray-400 mt-1">Pour tester Izou</p>
              <p className="text-[2.5rem] font-[900] mt-4 leading-none">Gratuit</p>
              <ul className="mt-6 space-y-3">
                {["Jusqu'à 50 clients", "Carte personnalisable", "QR code illimité", "Dashboard basique"].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-500">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/dashboard/register"
                className="mt-8 block text-center bg-gray-100 text-[#111] py-3 rounded-full text-[13px] font-bold hover:bg-gray-200 transition-colors"
              >
                Commencer
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="bg-[#4F46E5] rounded-3xl p-8 text-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#111] text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Populaire
              </div>
              <p className="text-[14px] font-bold text-indigo-200">Pro</p>
              <p className="text-[13px] text-indigo-300 mt-1">Pour les commerçants ambitieux</p>
              <p className="text-[2.5rem] font-[900] mt-4 leading-none">
                19€<span className="text-[16px] font-semibold text-indigo-300">/mois</span>
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Clients illimités",
                  "Notifications push",
                  "Dashboard complet",
                  "Support prioritaire",
                  "Statistiques avancées",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-[13px] text-indigo-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/register"
                className="mt-8 block text-center bg-white text-[#4F46E5] py-3 rounded-full text-[13px] font-bold hover:bg-indigo-50 transition-colors"
              >
                Commencer
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <p className="text-[14px] font-bold text-gray-400">Business</p>
              <p className="text-[13px] text-gray-400 mt-1">Multi-points de vente</p>
              <p className="text-[2.5rem] font-[900] mt-4 leading-none">
                49€<span className="text-[16px] font-semibold text-gray-300">/mois</span>
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Tout le plan Pro",
                  "Multi-boutiques",
                  "API & intégrations",
                  "Manager dédié",
                  "Export données",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-[13px] text-gray-500">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/register"
                className="mt-8 block text-center bg-gray-100 text-[#111] py-3 rounded-full text-[13px] font-bold hover:bg-gray-200 transition-colors"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
            {/* Left */}
            <div>
              <h2 className="text-[2rem] sm:text-[2.25rem] font-[900] tracking-tight leading-[1.1]">
                Questions
                <br />
                & réponses
              </h2>
              <p className="mt-3 text-[14px] text-gray-400 leading-relaxed">
                Tout ce qu&apos;il faut savoir sur Izou.
              </p>
            </div>

            {/* Right */}
            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="border border-gray-100 rounded-2xl overflow-hidden bg-white"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left text-[15px] font-bold hover:bg-gray-50/50 transition-colors"
                    aria-expanded={openFaq === i}
                  >
                    <span className="pr-4">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${
                      openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 text-[14px] text-gray-400 leading-relaxed">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-[2rem] sm:text-[2.75rem] font-[900] tracking-tight leading-[1.1]">
            Prêt à fidéliser
            <br />
            <span className="text-[#4F46E5]">vos clients ?</span>
          </h2>
          <p className="mt-4 text-[15px] text-gray-400 max-w-[400px] mx-auto leading-relaxed">
            Rejoignez les commerçants qui fidélisent autrement. Gratuit, simple, et vos clients vont adorer.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/register"
              className="bg-[#4F46E5] text-white px-8 py-4 rounded-full text-[15px] font-bold hover:bg-[#4338CA] transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-3 text-[12px] text-gray-300">
            Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#4F46E5] flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-[14px] font-extrabold">izou</span>
              <span className="text-[11px] text-gray-300 ml-1">by fidelizy</span>
            </div>

            <div className="flex items-center gap-8 text-[12px] text-gray-400 font-medium">
              <a href="#fonctionnalites" className="hover:text-[#111] transition-colors">Fonctionnalités</a>
              <a href="#tarifs" className="hover:text-[#111] transition-colors">Tarifs</a>
              <a href="#temoignages" className="hover:text-[#111] transition-colors">Témoignages</a>
              <Link href="/dashboard/register" className="hover:text-[#111] transition-colors">Commencer</Link>
            </div>

            <p className="text-[11px] text-gray-300">
              &copy; {new Date().getFullYear()} Fidelizy. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Izou by Fidelizy",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: "Programme de fidélité digital pour commerçants de proximité.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "127" },
          }),
        }}
      />
    </div>
  );
}
