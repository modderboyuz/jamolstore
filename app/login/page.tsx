"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageCircle, ExternalLink, CheckCircle, XCircle, Clock, Shield } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { isTelegramWebApp } = useTelegram()

  const [isLoading, setIsLoading] = useState(false)
  const [telegramUrl, setTelegramUrl] = useState("")
  const [tempToken, setTempToken] = useState("")
  const [loginStatus, setLoginStatus] = useState<"pending" | "approved" | "rejected" | null>(null)

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (tempToken && loginStatus === "pending") {
      // Poll for login status
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/admin-login?token=${tempToken}`)
          const data = await response.json()

          if (data.status === "approved" && data.user) {
            setLoginStatus("approved")
            localStorage.setItem("jamolstroy_admin", JSON.stringify(data.user))
            setTimeout(() => {
              window.location.href = "/"
            }, 1000)
          } else if (data.status === "rejected") {
            setLoginStatus("rejected")
          } else if (data.status === "unauthorized") {
            setLoginStatus("rejected")
            alert("Admin huquqi talab qilinadi!")
          }
        } catch (error) {
          console.error("Admin login status check error:", error)
        }
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [tempToken, loginStatus])

  const handleTelegramLogin = async () => {
    try {
      setIsLoading(true)
      const clientId = "jamolstroy_admin_" + Date.now()

      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ client_id: clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        setTempToken(data.temp_token)
        setTelegramUrl(data.telegram_url)
        setLoginStatus("pending")

        // Open Telegram
        window.open(data.telegram_url, "_blank")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Admin Telegram login error:", error)
      alert("Telegram login xatoligi")
    } finally {
      setIsLoading(false)
    }
  }

  const resetLogin = () => {
    setLoginStatus(null)
    setTempToken("")
    setTelegramUrl("")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (isTelegramWebApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>Telegram Web App orqali admin panelga kirish</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Admin panelga o'tish
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">JamolStroy Admin</CardTitle>
          <CardDescription>Admin panel uchun Telegram orqali kiring</CardDescription>
        </CardHeader>
        <CardContent>
          {loginStatus === "pending" ? (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">Telegram orqali tasdiqlang</h3>
              <p className="text-muted-foreground text-sm">Telegram botga o'ting va admin login so'rovini tasdiqlang</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Faqat admin huquqiga ega foydalanuvchilar kirishi mumkin
                </p>
              </div>
              {telegramUrl && (
                <Button variant="outline" onClick={() => window.open(telegramUrl, "_blank")} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Telegram botni ochish
                </Button>
              )}
              <Button variant="ghost" onClick={resetLogin} className="w-full">
                Bekor qilish
              </Button>
            </div>
          ) : loginStatus === "approved" ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold text-green-600">Admin login muvaffaqiyatli!</h3>
              <p className="text-muted-foreground text-sm">Admin panelga yo'naltirilmoqda...</p>
            </div>
          ) : loginStatus === "rejected" ? (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h3 className="text-lg font-semibold text-red-600">Login rad etildi</h3>
              <p className="text-muted-foreground text-sm">Admin huquqi yo'q yoki login rad etildi</p>
              <Button onClick={resetLogin} className="w-full">
                Qayta urinish
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <MessageCircle className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Admin Panel</h3>
                <p className="text-muted-foreground text-sm">Admin huquqiga ega Telegram akkauntingiz bilan kiring</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🔒 Bu admin panel. Faqat admin huquqiga ega foydalanuvchilar kirishi mumkin.
                </p>
              </div>
              <Button onClick={handleTelegramLogin} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Admin sifatida kirish
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
