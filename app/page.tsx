"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Package, TrendingUp, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalOrders: number
  todayOrders: number
  totalProducts: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const { isReady } = useTelegram()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (isReady && !loading && !user) {
      router.push("/login")
    }
  }, [isReady, loading, user, router])

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)

      // Get total orders
      const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })

      // Get today's orders
      const today = new Date().toISOString().split("T")[0]
      const { count: todayOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today)

      // Get total products
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_available", true)

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"])

      // Get completed orders
      const { count: completedOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "delivered")

      // Get total revenue from completed orders
      const { data: revenueData } = await supabase.from("orders").select("total_amount").eq("status", "delivered")

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      setStats({
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        totalProducts: totalProducts || 0,
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        completedOrders: completedOrders || 0,
      })
    } catch (error) {
      console.error("Dashboard stats fetch error:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Bosh sahifa</h1>
            <p className="text-sm text-muted-foreground">Xush kelibsiz, {user.first_name}!</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("uz-UZ", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami buyurtmalar</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground">Barcha vaqt davomida</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugungi buyurtmalar</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.todayOrders}
              </div>
              <p className="text-xs text-muted-foreground">Bugun qabul qilingan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mahsulotlar</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground">Mavjud mahsulotlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${formatPrice(stats.totalRevenue)} so'm`
                )}
              </div>
              <p className="text-xs text-muted-foreground">Yetkazilgan buyurtmalar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Kutilayotgan buyurtmalar
              </CardTitle>
              <CardDescription>Tasdiqlanishi yoki bajarilishi kerak bo'lgan buyurtmalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.pendingOrders}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Tez orada ko'rib chiqing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Bajarilgan buyurtmalar
              </CardTitle>
              <CardDescription>Muvaffaqiyatli yetkazilgan buyurtmalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.completedOrders}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Mijozlar mamnun</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tezkor harakatlar</CardTitle>
            <CardDescription>Eng ko'p ishlatiladigan funksiyalar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => router.push("/orders")}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <ShoppingBag className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Buyurtmalarni ko'rish</h3>
                  <p className="text-sm text-muted-foreground">Barcha buyurtmalar ro'yxati</p>
                </div>
              </button>

              <button
                onClick={() => router.push("/orders/today")}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Bugungi buyurtmalar</h3>
                  <p className="text-sm text-muted-foreground">Bugun kelgan buyurtmalar</p>
                </div>
              </button>

              <button
                onClick={() => router.push("/products")}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Mahsulotlar</h3>
                  <p className="text-sm text-muted-foreground">Mahsulotlarni boshqarish</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
