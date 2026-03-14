"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Users,
  Zap,
  Bell,
  Settings,
  User,
  LogOut,
  QrCode,
  TrendingUp,
  UserPlus,
  Stamp,
  CalendarDays,
  RefreshCcw,
  AlertTriangle,
  UserX,
  Trophy,
  Download,
  ChevronRight,
  Check,
  Gift,
  Heart,
  Star,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

/* ═══════════════════════════════════
   REDESIGN PREVIEW — Navigation Hub
   ═══════════════════════════════════ */

type Page = "hub" | "dashboard" | "card" | "login";

export default function RedesignPreview() {
  const [page, setPage] = useState<Page>("hub");

  if (page === "dashboard") return <DashboardPreview onBack={() => setPage("hub")} />;
  if (page === "card") return <CardPreview onBack={() => setPage("hub")} />;
  if (page === "login") return <LoginPreview onBack={() => setPage("hub")} />;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-[var(--font-jakarta)]">
      <div className="max-w-3xl mx-auto px-5 py-20 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">izou</span>
          <span className="text-xs text-gray-300 font-medium ml-1">redesign preview</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-4">
          UI Redesign Preview
        </h1>
        <p className="text-gray-400 text-[15px] mb-12 max-w-md mx-auto">
          Aperçu des pages principales redesignées avec le nouveau design system Izou. Données fictives.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              id: "dashboard" as Page,
              title: "Dashboard",
              desc: "Tableau de bord commerçant",
              icon: Home,
              color: "bg-[#4F46E5]",
            },
            {
              id: "card" as Page,
              title: "Carte Client",
              desc: "Vue carte de fidélité",
              icon: Smartphone,
              color: "bg-amber-500",
            },
            {
              id: "login" as Page,
              title: "Login",
              desc: "Connexion commerçant",
              icon: User,
              color: "bg-emerald-500",
            },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPage(p.id)}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all text-left group"
            >
              <div className={`w-11 h-11 ${p.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <p.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-[15px] mb-1">{p.title}</p>
              <p className="text-[13px] text-gray-400">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   DASHBOARD PREVIEW
   ═════════════════════════════════════════ */
function DashboardPreview({ onBack }: { onBack: () => void }) {
  const f = "font-[var(--font-jakarta)]";

  const sidebarLinks = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Users, label: "Clients", active: false },
    { icon: Zap, label: "Engagement", active: false },
    { icon: Bell, label: "Notifications", active: false },
    { icon: Settings, label: "Paramètres", active: false },
  ];

  return (
    <div className={`flex h-screen bg-[#FAFAFA] ${f}`}>
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[260px] bg-white border-r border-gray-100 flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight">izou</span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-50">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.15em]">Commerce</p>
          <p className="text-[13px] font-bold text-[#111] mt-0.5">Boulangerie Les Délices</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                link.active
                  ? "bg-[#4F46E5] text-white"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <link.icon className={`w-[18px] h-[18px] ${link.active ? "text-white" : "text-gray-300"}`} />
              {link.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-400 hover:bg-gray-50">
            <User className="w-[18px] h-[18px] text-gray-300" />
            Mon profil
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-400 hover:bg-red-50 hover:text-red-500">
            <LogOut className="w-[18px] h-[18px] text-gray-300" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1100px]">
          {/* Back button (for preview) */}
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-gray-300 hover:text-gray-500 mb-6 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour au hub
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[22px] font-[900] tracking-tight text-[#111]">Tableau de bord</h1>
              <p className="text-[13px] text-gray-300 mt-0.5">Mardi 11 mars 2026</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-[13px] transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Saisie manuelle
              </button>
              <button className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold px-5 py-2.5 rounded-xl text-[13px] transition-colors shadow-sm shadow-indigo-200">
                <QrCode className="w-4 h-4" />
                Scanner
              </button>
            </div>
          </div>

          {/* KPI Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {[
              { icon: Users, val: "247", label: "Clients total", trend: null },
              { icon: CalendarDays, val: "12", label: "Visites aujourd'hui", trend: "+3" },
              { icon: UserPlus, val: "34", label: "Nouveaux ce mois", trend: "+18%" },
              { icon: Stamp, val: "156", label: "Tampons ce mois", trend: null },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <k.icon className="w-4 h-4 text-gray-300" />
                  {k.trend && (
                    <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {k.trend}
                    </span>
                  )}
                </div>
                <p className="text-[1.75rem] font-[900] leading-none text-[#111]">{k.val}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{k.label}</p>
              </div>
            ))}
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { icon: RefreshCcw, val: "72%", label: "Taux de retour", color: "text-[#111]" },
              { icon: TrendingUp, val: "3.2", label: "Fréquence moy.", color: "text-[#111]" },
              { icon: AlertTriangle, val: "8", label: "À risque", color: "text-amber-500" },
              { icon: UserX, val: "3", label: "Perdus", color: "text-red-500" },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <k.icon className={`w-4 h-4 ${k.color === "text-[#111]" ? "text-gray-300" : k.color} mb-3`} />
                <p className={`text-[1.75rem] font-[900] leading-none ${k.color}`}>{k.val}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Chart + Top 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[14px] font-bold text-[#111]">Visites cette semaine</h2>
                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">+18%</span>
              </div>
              <div className="flex items-end gap-2 h-[180px]">
                {[
                  { day: "Lun", val: 35, highlight: false },
                  { day: "Mar", val: 55, highlight: false },
                  { day: "Mer", val: 45, highlight: false },
                  { day: "Jeu", val: 70, highlight: false },
                  { day: "Ven", val: 50, highlight: false },
                  { day: "Sam", val: 85, highlight: true },
                  { day: "Dim", val: 30, highlight: false },
                ].map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-lg transition-all ${
                          d.highlight
                            ? "bg-[#4F46E5] shadow-sm shadow-indigo-200"
                            : "bg-gray-100"
                        }`}
                        style={{ height: `${d.val}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${d.highlight ? "text-[#4F46E5]" : "text-gray-300"}`}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-[14px] font-bold text-[#111]">Top clients</h2>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Léa P.", visits: 42, medal: "text-amber-400", bg: "bg-amber-400" },
                  { name: "Hugo R.", visits: 38, medal: "text-gray-400", bg: "bg-indigo-500" },
                  { name: "Inès M.", visits: 31, medal: "text-orange-400", bg: "bg-rose-400" },
                ].map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <span className={`text-[16px] font-[900] ${c.medal} w-5`}>{i + 1}</span>
                    <div className={`w-8 h-8 ${c.bg} rounded-full flex items-center justify-center text-[11px] font-bold text-white`}>
                      {c.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#111]">{c.name}</p>
                      <p className="text-[11px] text-gray-300">{c.visits} visites</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code + Join link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.15em] mb-4">Code commerce</p>
              <div className="w-[160px] h-[160px] bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-100">
                <QrCode className="w-20 h-20 text-gray-200" />
              </div>
              <p className="font-mono text-2xl font-[900] tracking-[0.1em] text-[#111] mb-1">AB3K9Z</p>
              <p className="text-[11px] text-gray-300 mb-4">Vos clients entrent ce code sur izou.app</p>
              <button className="inline-flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-xl text-[12px] font-bold hover:bg-[#4338CA] transition-colors">
                <Download className="w-3.5 h-3.5" />
                Télécharger PDF
              </button>
            </div>

            <div className="bg-[#4F46E5] rounded-2xl p-6 flex flex-col justify-between text-white">
              <div>
                <p className="text-[14px] font-bold">Lien d&apos;inscription direct</p>
                <p className="text-[12px] text-indigo-200 mt-1 break-all font-mono">
                  https://izou.app/join/abc123-def456
                </p>
              </div>
              <button className="self-start mt-4 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl text-[12px] font-bold transition-colors">
                <Copy className="w-3.5 h-3.5" />
                Copier le lien
              </button>
            </div>
          </div>

          {/* Recent scans */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#111]">Derniers passages</h2>
              <span className="text-[11px] text-gray-300 font-medium">Voir tout</span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { name: "Léa P.", action: "+1 tampon", time: "Il y a 5 min", bg: "bg-amber-400" },
                { name: "Hugo R.", action: "Récompense !", time: "Il y a 23 min", bg: "bg-indigo-500" },
                { name: "Inès M.", action: "+1 tampon", time: "Il y a 1h", bg: "bg-rose-400" },
                { name: "Paul D.", action: "+1 tampon", time: "Il y a 2h", bg: "bg-emerald-400" },
                { name: "Julie K.", action: "Nouveau client", time: "Hier à 18:30", bg: "bg-violet-400" },
              ].map((s) => (
                <div key={s.name + s.time} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${s.bg} rounded-full flex items-center justify-center text-[11px] font-bold text-white`}>
                      {s.name[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#111]">{s.name}</p>
                      <p className="text-[11px] text-gray-300">{s.time}</p>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#4F46E5]">{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   CARD PREVIEW (Customer facing)
   ═════════════════════════════════════════ */
function CardPreview({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"card" | "missions" | "history">("card");
  const color = "#4F46E5";
  const stampsCount = 7;
  const stampsRequired = 10;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-[var(--font-jakarta)] max-w-[430px] mx-auto relative">
      {/* Back (preview only) */}
      <button onClick={onBack} className="absolute top-4 left-4 z-50 flex items-center gap-1.5 text-[11px] text-gray-300 font-medium">
        <ArrowLeft className="w-3.5 h-3.5" /> Hub
      </button>

      {/* Header — business branding */}
      <div className="pt-12 pb-6 px-5" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
        <p className="text-white/60 text-[11px] font-medium">Carte de fidélité</p>
        <h1 className="text-white text-[20px] font-[900] mt-0.5">Boulangerie Les Délices</h1>
      </div>

      {/* Compact QR */}
      <div className="px-5 -mt-3">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
            <QrCode className="w-7 h-7 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400">Votre code fidélité</p>
            <p className="font-mono text-[15px] font-[900] tracking-[0.08em] text-[#111]">A1B2-C3D4</p>
          </div>
          <button className="text-[11px] font-bold text-[#4F46E5] bg-indigo-50 px-3 py-1.5 rounded-lg">
            Copier
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-5 mt-5 mb-4">
        {[
          { id: "card" as const, label: "Ma carte", icon: Smartphone },
          { id: "missions" as const, label: "Missions", icon: Star },
          { id: "history" as const, label: "Historique", icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors ${
              tab === t.id
                ? "bg-[#111] text-white"
                : "bg-white text-gray-400 border border-gray-100"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-5 pb-10">
        {tab === "card" && (
          <>
            {/* Stamps card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-bold text-[#111]">Vos tampons</p>
                <span className="text-[11px] font-bold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-full">
                  {stampsCount}/{stampsRequired}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2.5 mb-4">
                {Array.from({ length: stampsRequired }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                      i < stampsCount
                        ? "bg-[#4F46E5] shadow-sm shadow-indigo-200"
                        : i === stampsRequired - 1
                          ? "border-2 border-dashed border-amber-300 bg-amber-50"
                          : "border-2 border-dashed border-gray-150 bg-gray-50"
                    }`}
                  >
                    {i < stampsCount ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : i === stampsRequired - 1 ? (
                      <Gift className="w-4 h-4 text-amber-400" />
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(stampsCount / stampsRequired) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                Plus que <span className="font-bold text-[#111]">{stampsRequired - stampsCount} tampons</span> avant votre récompense
              </p>
            </div>

            {/* Reward */}
            <div className="bg-[#111] rounded-2xl p-5 flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white">Croissant offert</p>
                <p className="text-[11px] text-white/40">Votre prochaine récompense</p>
              </div>
            </div>

            {/* Apple Wallet */}
            <button className="w-full bg-[#111] rounded-2xl py-3.5 flex items-center justify-center gap-2 text-white text-[13px] font-bold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Ajouter à Apple Wallet
            </button>
          </>
        )}

        {tab === "missions" && (
          <div className="space-y-3">
            {[
              { title: "Laisser un avis Google", reward: "+50 pts", status: "todo", icon: Star },
              { title: "Compléter son profil", reward: "+30 pts", status: "done", icon: User },
              { title: "Parrainer un ami", reward: "+100 pts", status: "todo", icon: Users },
              { title: "5 visites ce mois", reward: "+25 pts", status: "progress", icon: TrendingUp, progress: "3/5" },
            ].map((m) => (
              <div key={m.title} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  m.status === "done" ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {m.status === "done" ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <m.icon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold ${m.status === "done" ? "text-gray-400 line-through" : "text-[#111]"}`}>
                    {m.title}
                  </p>
                  {m.progress && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: "60%" }} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{m.progress}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  m.status === "done" ? "bg-emerald-50 text-emerald-500" : "bg-indigo-50 text-[#4F46E5]"
                }`}>
                  {m.status === "done" ? "Fait" : m.reward}
                </span>
              </div>
            ))}

            {/* Referral */}
            <div className="bg-[#4F46E5] rounded-2xl p-5 text-white mt-4">
              <p className="text-[14px] font-bold">Parrainez un ami</p>
              <p className="text-[11px] text-indigo-200 mt-1">Partagez votre code et gagnez 100 points</p>
              <div className="mt-3 bg-white/15 rounded-xl p-3 flex items-center justify-between">
                <span className="font-mono text-[15px] font-bold tracking-wider">SOPHIE-2024</span>
                <button className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors">
                  Copier
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {[
              { action: "+1 tampon", date: "11 mars à 09:15", type: "stamp" },
              { action: "+1 tampon", date: "8 mars à 14:30", type: "stamp" },
              { action: "Croissant offert", date: "5 mars à 10:00", type: "reward" },
              { action: "+1 tampon", date: "2 mars à 08:45", type: "stamp" },
              { action: "+1 tampon", date: "27 fév à 16:20", type: "stamp" },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    t.type === "reward" ? "bg-amber-100" : "bg-indigo-50"
                  }`}>
                    {t.type === "reward" ? (
                      <Gift className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Stamp className="w-4 h-4 text-[#4F46E5]" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#111]">{t.action}</p>
                    <p className="text-[11px] text-gray-300">{t.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   LOGIN PREVIEW
   ═════════════════════════════════════════ */
function LoginPreview({ onBack }: { onBack: () => void }) {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="min-h-screen bg-white font-[var(--font-jakarta)] flex items-center justify-center px-5">
      <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-1.5 text-[12px] text-gray-300 font-medium">
        <ArrowLeft className="w-3.5 h-3.5" /> Hub
      </button>

      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-200">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-[22px] font-[900] tracking-tight">izou</span>
        </div>

        <h1 className="text-[24px] font-[900] tracking-tight text-center mb-1">Content de vous revoir</h1>
        <p className="text-[14px] text-gray-400 text-center mb-8">Connectez-vous à votre espace commerçant</p>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="sophie@boulangerie.fr"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium text-[#111] placeholder:text-gray-300 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium text-[#111] placeholder:text-gray-300 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all pr-11"
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3.5 rounded-xl text-[14px] font-bold transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center gap-2">
            Se connecter
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400">
            Pas encore de compte ?{" "}
            <span className="text-[#4F46E5] font-bold cursor-pointer hover:underline">
              Créer mon programme
            </span>
          </p>
        </div>

        {/* OTP preview */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest text-center mb-4">
            Étape 2 — Vérification OTP
          </p>
          <div className="flex items-center justify-center gap-2">
            {["4", "8", "2", "", "", ""].map((d, i) => (
              <div
                key={i}
                className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-[20px] font-[900] ${
                  d
                    ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5]"
                    : "border-gray-200 bg-gray-50 text-gray-200"
                }`}
              >
                {d || "0"}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-300 text-center mt-3">
            Code envoyé par email
          </p>
        </div>
      </div>
    </div>
  );
}
