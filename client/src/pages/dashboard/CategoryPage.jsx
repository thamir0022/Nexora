import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Loader2, AlertCircle, Check, Calendar } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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

const CategoryPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.getValue("status")}
          </Badge>
        ),
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/categories")

        if (response.data.success) {
          setCategories(response.data.categories)
        } else {
          const errorMsg = response.data.message || "Failed to fetch categories"
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred while fetching categories"
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [axios])

  // Format date helper
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
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
      const response = await axios.post("/categories", data)

      if (response.data.success) {
        setCategories((prev) => [response.data.data, ...prev])
        toast.success("Category added successfully")
        setIsAddDialogOpen(false)
        addForm.reset()
      } else {
        toast.error(response.data.message || "Failed to add category")
      }
    } catch (error) {
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
      const response = await axios.patch(`/categories/${selectedCategory._id}`, data)

      if (response.data.success) {
        setCategories((prev) => prev.map((cat) => (cat._id === selectedCategory._id ? { ...cat, ...data } : cat)))
        toast.success("Category updated successfully")
        setIsManageDialogOpen(false)
        setSelectedCategory(null)
      } else {
        toast.error(response.data.message || "Failed to update category")
      }
    } catch (error) {
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
      const response = await axios.delete(`/categories/${selectedCategory._id}`)

      if (response.data.success) {
        setCategories((prev) => prev.filter((cat) => cat._id !== selectedCategory._id))
        toast.success("Category deleted successfully")
        setIsManageDialogOpen(false)
        setSelectedCategory(null)
      } else {
        toast.error(response.data.message || "Failed to delete category")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while deleting the category")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading categories...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <section className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Category Management</h2>
          <p className="text-muted-foreground mt-1">Manage course categories and their descriptions</p>
        </div>

        {/* Add Category Dialog */}
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
        pageSize={10}
        className="w-full"
        onRowClick={(row) => handleRowClick(row.original._id)}
      />

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