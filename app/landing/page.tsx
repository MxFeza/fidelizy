import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title:
    "Izou by Fidelizy – Programme de fidélité digital pour commerçants | Carte de fidélité dématérialisée",
  description:
    "Izou digitalise la fidélité client de votre commerce. Carte de fidélité sur smartphone, tableau de bord commerçant, notifications push et statistiques. Simple, efficace, sans application à télécharger.",
  keywords: [
    "carte de fidélité digitale",
    "programme fidélité commerçant",
    "fidélisation client",
    "carte de fidélité dématérialisée",
    "fidélité commerce de proximité",
    "Izou",
    "Fidelizy",
    "carte de fidélité smartphone",
    "fidélisation digitale",
    "programme de fidélité sans application",
  ],
  openGraph: {
    title: "Izou by Fidelizy – La fidélité digitale pour votre commerce",
    description:
      "Transformez chaque visite en relation durable. Programme de fidélité digital clé en main pour commerçants.",
    type: "website",
    locale: "fr_FR",
    siteName: "Izou by Fidelizy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Izou – Programme de fidélité digital pour commerçants",
    description:
      "Carte de fidélité sur smartphone, tableau de bord commerçant, statistiques en temps réel.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/landing",
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
