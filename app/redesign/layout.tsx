import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function RedesignLayout({ children }: { children: React.ReactNode }) {
  return <div className={jakarta.variable}>{children}</div>;
}
