import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NotificationToast from "../components/NotificationToast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Artify | Connect with Traditional Handmade Artisans",
  description: "Artify connects street artisans, clay artists, pottery makers, and handmade creators directly with customers. Browse beautiful traditional crafts and read their origin stories.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-clay-50 text-clay-900 font-sans">
        <AppProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <NotificationToast />
        </AppProvider>
      </body>
    </html>
  );
}
