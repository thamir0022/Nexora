"use client"

import { useState, useEffect, useMemo } from "react"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Loader2, AlertCircle, Check, Calendar, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { format } from "date-fns"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { DataTable } from "@/components/datatable/data-table"

const categoryStatuses = ["active", "disabled", "rejected", "draft"]

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "disabled", "rejected", "draft"], {
    errorMap: () => ({ message: "Status must be one of: active, disabled, rejected, or draft" }),
  }),
})

// Skeleton Components
const HeaderSkeleton = () => (
  <div className="flex justify-between items-start mb-8">
    <div className="space-y-4 flex-1">
      <div className="space-y-2">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Search Input Skeleton */}
      <div className="relative max-w-md">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* Search Results Info Skeleton */}
      <Skeleton className="h-4 w-48" />
    </div>

    {/* Add Button Skeleton */}
    <Skeleton className="h-10 w-32 rounded-md" />
  </div>
)

const TableSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      {/* Table Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </CardHeader>

    <CardContent className="p-0">
      {/* Table Headers */}
      <div className="border-b border-border">
        <div className="grid grid-cols-4 gap-4 p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="border-b border-border last:border-b-0">
          <div className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/50">
            {/* Name Column */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Description Column */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="h-3 w-24" />
            </div>

            {/* Status Column */}
            <div className="flex items-center">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Created Column */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </CardContent>

    {/* Pagination Skeleton */}
    <div className="flex items-center justify-between p-4 border-t border-border">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  </Card>
)

const LoadingSkeleton = () => (
  <section className="container mx-auto py-8 px-4">
    <HeaderSkeleton />
    <TableSkeleton />
  </section>
)

const CategoryPage = () => {
  // State management
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search functionality
  const [searchText, setSearchText] = useState("")
  const [debouncedSearch] = useDebounce(searchText, 500)

  const axios = useAxiosPrivate()

  // Form setup for add category
  const addForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
    },
  })

  // Form setup for edit category
  const editForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      status: "",
    },
  })

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("description") || "No description"}</div>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status")
          return (
            <Badge
              variant="outline"
              className={`capitalize ${
                status === "active"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : status === "disabled"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : status === "draft"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{formatDate(row.getValue("createdAt"))}</span>
          </div>
        ),
      },
    ],
    [],
  )

  // Fetch categories with search functionality
  const fetchCategories = async (searchQuery = "") => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        sortBy: "createdAt",
        order: "desc",
      })

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim())
      }

      console.log("Fetching categories with params:", params.toString())

      const response = await axios.get(`/categories?${params.toString()}`)

      console.log("API Response:", response.data)

      if (response.data.success) {
        // Fix: Use response.data.data instead of response.data.categories
        const categoriesData = response.data.data || []
        setCategories(categoriesData)
        console.log("Categories set:", categoriesData)
      } else {
        const errorMsg = response.data.message || "Failed to fetch categories"
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      const errorMessage = error.response?.data?.message || "An error occurred while fetching categories"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories when component mounts or search changes
  useEffect(() => {
    fetchCategories(debouncedSearch)
  }, [debouncedSearch])

  // Format date helper
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  // Handle search clear
  const handleClearSearch = () => {
    setSearchText("")
  }

  // Handle row click
  const handleRowClick = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId)
    if (category) {
      setSelectedCategory(category)
      editForm.reset({
        name: category.name,
        description: category.description || "",
        status: category.status,
      })
      setIsManageDialogOpen(true)
    }
  }

  // Handle add category
  const handleAddCategory = async (data) => {
    try {
      setIsSubmitting(true)
      console.log("Adding category:", data)

      const response = await axios.post("/categories", data)

      console.log("Add category response:", response.data)

      if (response.data.success) {
        // Refresh the list to maintain search/sort order
        await fetchCategories(debouncedSearch)
        toast.success("Category added successfully")
        setIsAddDialogOpen(false)
        addForm.reset()
      } else {
        toast.error(response.data.message || "Failed to add category")
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error(error.response?.data?.message || "An error occurred while adding the category")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit category
  const handleEditCategory = async (data) => {
    if (!selectedCategory) return

    try {
      setIsSubmitting(true)
      console.log("Editing category:", selectedCategory._id, data)

      const response = await axios.patch(`/categories/${selectedCategory._id}`, data)

      console.log("Edit category response:", response.data)

      if (response.data.success) {
        // Update local state
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === selectedCategory._id ? { ...cat, ...data, updatedAt: new Date().toISOString() } : cat,
          ),
        )
        toast.success("Category updated successfully")
        setIsManageDialogOpen(false)
        setSelectedCategory(null)
      } else {
        toast.error(response.data.message || "Failed to update category")
      }
    } catch (error) {
      console.error("Error editing category:", error)
      toast.error(error.response?.data?.message || "An error occurred while updating the category")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      setIsSubmitting(true)
      console.log("Deleting category:", selectedCategory._id)

      const response = await axios.delete(`/categories/${selectedCategory._id}`)

      console.log("Delete category response:", response.data)

      if (response.data.success) {
        setCategories((prev) => prev.filter((cat) => cat._id !== selectedCategory._id))
        toast.success("Category deleted successfully")
        setIsManageDialogOpen(false)
        setSelectedCategory(null)
      } else {
        toast.error(response.data.message || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error(error.response?.data?.message || "An error occurred while deleting the category")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state with skeleton
  if (loading && categories.length === 0) {
    return <LoadingSkeleton />
  }

  // Error state (only show if no categories and there's an error)
  if (error && categories.length === 0) {
    return (
      <section className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64 text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>{error}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Category Management</h2>
          <p className="text-muted-foreground">Manage course categories and their descriptions</p>

          {/* Search Input */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search categories by name or description..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {searchText && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-md transition-colors"
                type="button"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {searchText && (
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching...
                </span>
              ) : (
                `Found ${categories.length} ${categories.length === 1 ? "category" : "categories"} matching "${searchText}"`
              )}
            </p>
          )}
        </div>

        {/* Add Category Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new category for organizing courses.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(handleAddCategory)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-name">Category Name</Label>
                  <Input id="add-name" placeholder="Enter category name" {...addForm.register("name")} />
                  {addForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{addForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-description">Description</Label>
                  <Textarea
                    id="add-description"
                    placeholder="Enter category description"
                    rows={3}
                    {...addForm.register("description")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-status">Status</Label>
                  <Controller
                    name="status"
                    control={addForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryStatuses.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {addForm.formState.errors.status && (
                    <p className="text-sm text-red-500">{addForm.formState.errors.status.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories DataTable */}
      <DataTable
        columns={columns}
        data={categories}
        isLoading={loading}
        pageSize={10}
        className="w-full"
        onRowClick={(row) => handleRowClick(row.original._id)}
      />

      {/* Empty State for Search */}
      {!loading && categories.length === 0 && searchText && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-500 mb-4">
            No categories match your search for "{searchText}". Try adjusting your search terms.
          </p>
          <Button variant="outline" onClick={handleClearSearch}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Empty State for No Categories */}
      {!loading && categories.length === 0 && !searchText && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first category to organize your courses.</p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Your First Category
          </Button>
        </div>
      )}

      {/* Manage Category Dialog (Edit/Delete) */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Category</DialogTitle>
            <DialogDescription>Edit category details or delete the category.</DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-6">
              {/* Edit Form */}
              <form onSubmit={editForm.handleSubmit(handleEditCategory)}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Category Name</Label>
                    <Input id="edit-name" placeholder="Enter category name" {...editForm.register("name")} />
                    {editForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter category description"
                      rows={3}
                      {...editForm.register("description")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Controller
                      name="status"
                      control={editForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryStatuses.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {editForm.formState.errors.status && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.status.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <Separator />

              {/* Delete Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete this category. This action cannot be undone.
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <p className="font-medium text-red-900">{selectedCategory.name}</p>
                  <p className="text-sm text-red-700 mt-1">{selectedCategory.description || "No description"}</p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteCategory}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Category
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsManageDialogOpen(false)
                setSelectedCategory(null)
              }}
              disabled={isSubmitting}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default CategoryPage
