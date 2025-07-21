"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search, Package, Plus, Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Product {
  id: string
  name_uz: string
  name_ru: string
  description_uz: string
  price: number
  unit: string
  product_type: "sale" | "rental"
  rental_price_per_unit?: number
  rental_time_unit?: "hour" | "day" | "week" | "month"
  images: string[]
  is_available: boolean
  is_featured: boolean
  is_popular: boolean
  stock_quantity: number
  min_order_quantity: number
  view_count: number
  created_at: string
  category: {
    name_uz: string
  }
}

export default function ProductsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Products fetch error:", error)
    } finally {
      setProductsLoading(false)
    }
  }

  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("products").update({ is_available: !currentStatus }).eq("id", productId)

      if (error) throw error

      setProducts(
        products.map((product) => (product.id === productId ? { ...product, is_available: !currentStatus } : product)),
      )
    } catch (error) {
      console.error("Product availability update error:", error)
      alert("Mahsulot holatini yangilashda xatolik")
    }
  }

  const toggleProductFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("products").update({ is_featured: !currentStatus }).eq("id", productId)

      if (error) throw error

      setProducts(
        products.map((product) => (product.id === productId ? { ...product, is_featured: !currentStatus } : product)),
      )
    } catch (error) {
      console.error("Product featured update error:", error)
      alert("Mahsulot holatini yangilashda xatolik")
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name_uz.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.name_uz.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
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
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Mahsulotlar</h1>
            <p className="text-sm text-muted-foreground">Mahsulotlarni boshqarish va tahrirlash</p>
          </div>
          <Button onClick={() => router.push("/products/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi mahsulot
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Jami mahsulotlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mavjud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{products.filter((p) => p.is_available).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mashhur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{products.filter((p) => p.is_popular).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">TOP mahsulotlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{products.filter((p) => p.is_featured).length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mahsulotlar ro'yxati</CardTitle>
            <CardDescription>Barcha mahsulotlarni ko'rish va boshqarish</CardDescription>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Mahsulot qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Qidiruv bo'yicha mahsulot topilmadi" : "Hozircha mahsulotlar yo'q"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rasm</TableHead>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Narx</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Ko'rishlar</TableHead>
                      <TableHead>Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0] || "/placeholder.svg"}
                                alt={product.name_uz}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name_uz}</div>
                            <div className="text-sm text-muted-foreground">{product.name_ru}</div>
                            <div className="flex gap-1 mt-1">
                              {product.is_featured && (
                                <Badge variant="secondary" className="text-xs">
                                  TOP
                                </Badge>
                              )}
                              {product.is_popular && (
                                <Badge variant="outline" className="text-xs">
                                  Mashhur
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category.name_uz}</TableCell>
                        <TableCell>
                          {product.product_type === "rental" && product.rental_price_per_unit ? (
                            <div>
                              <div>{formatPrice(product.rental_price_per_unit)} so'm</div>
                              <div className="text-xs text-muted-foreground">
                                /
                                {product.rental_time_unit === "hour"
                                  ? "soat"
                                  : product.rental_time_unit === "day"
                                    ? "kun"
                                    : product.rental_time_unit === "week"
                                      ? "hafta"
                                      : "oy"}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div>{formatPrice(product.price)} so'm</div>
                              <div className="text-xs text-muted-foreground">/{product.unit}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.product_type === "rental" ? "secondary" : "default"}>
                            {product.product_type === "rental" ? "Ijara" : "Sotuv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={product.is_available ? "default" : "secondary"}>
                              {product.is_available ? "Mavjud" : "Mavjud emas"}
                            </Badge>
                            <button
                              onClick={() => toggleProductAvailability(product.id, product.is_available)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {product.is_available ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>{product.view_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/products/edit/${product.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <button
                              onClick={() => toggleProductFeatured(product.id, product.is_featured)}
                              className={`p-2 rounded-md border ${
                                product.is_featured
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              ⭐
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Mahsulot tafsilotlari - {selectedProduct.name_uz}</CardTitle>
              <CardDescription>{formatDate(selectedProduct.created_at)} da yaratilgan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Asosiy ma'lumotlar</h4>
                  <p>
                    <strong>Nomi (O'zbek):</strong> {selectedProduct.name_uz}
                  </p>
                  <p>
                    <strong>Nomi (Rus):</strong> {selectedProduct.name_ru}
                  </p>
                  <p>
                    <strong>Kategoriya:</strong> {selectedProduct.category.name_uz}
                  </p>
                  <p>
                    <strong>Turi:</strong> {selectedProduct.product_type === "rental" ? "Ijara" : "Sotuv"}
                  </p>
                  <p>
                    <strong>Birlik:</strong> {selectedProduct.unit}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Narx va miqdor</h4>
                  {selectedProduct.product_type === "rental" && selectedProduct.rental_price_per_unit ? (
                    <>
                      <p>
                        <strong>Ijara narxi:</strong> {formatPrice(selectedProduct.rental_price_per_unit)} so'm
                      </p>
                      <p>
                        <strong>Vaqt birligi:</strong>{" "}
                        {selectedProduct.rental_time_unit === "hour"
                          ? "Soat"
                          : selectedProduct.rental_time_unit === "day"
                            ? "Kun"
                            : selectedProduct.rental_time_unit === "week"
                              ? "Hafta"
                              : "Oy"}
                      </p>
                    </>
                  ) : (
                    <p>
                      <strong>Narx:</strong> {formatPrice(selectedProduct.price)} so'm
                    </p>
                  )}
                  <p>
                    <strong>Ombordagi miqdor:</strong> {selectedProduct.stock_quantity}
                  </p>
                  <p>
                    <strong>Minimal buyurtma:</strong> {selectedProduct.min_order_quantity}
                  </p>
                  <p>
                    <strong>Ko'rishlar soni:</strong> {selectedProduct.view_count || 0}
                  </p>
                </div>
              </div>

              {selectedProduct.description_uz && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Tavsif</h4>
                  <p className="text-muted-foreground">{selectedProduct.description_uz}</p>
                </div>
              )}

              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Rasmlar</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedProduct.images.map((image, index) => (
                      <div key={index} className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`${selectedProduct.name_uz} ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button onClick={() => setSelectedProduct(null)} variant="outline">
                  Yopish
                </Button>
                <Button onClick={() => router.push(`/products/edit/${selectedProduct.id}`)}>Tahrirlash</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
