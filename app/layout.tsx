import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TelegramProvider } from "@/contexts/TelegramContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JamolStroy Admin Panel - Boshqaruv paneli",
  description: "JamolStroy admin panel - buyurtmalar va mahsulotlarni boshqarish",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <TelegramProvider>
            <AuthProvider>
              <SidebarProvider>
                <AdminSidebar />
                <SidebarInset>{children}</SidebarInset>
                <BottomNavigation />
              </SidebarProvider>
            </AuthProvider>
          </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
