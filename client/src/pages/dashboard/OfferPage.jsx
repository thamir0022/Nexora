import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Search, X, Plus, Calendar, Percent, Clock, Loader2, Check, Trash2 } from "lucide-react"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/datatable/data-table"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { cn } from "@/lib/utils"

// Validation schema
const offerSchema = z
  .object({
    name: z.string().min(1, "Offer name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
    type: z.string().min(1, "Offer type is required"),
    discountType: z.enum(["percentage", "flat"], {
      errorMap: () => ({ message: "Discount type must be percentage or flat" }),
    }),
    discountValue: z.number().min(0.01, "Discount value must be greater than 0"),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .transform((val) => new Date(val)),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .transform((val) => new Date(val)),
    status: z.enum(["upcoming", "active", "expired", "inactive", "paused"], {
      errorMap: () => ({ message: "Invalid status" }),
    }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

const OfferManagementPage = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const axios = useAxiosPrivate()

  // Form setup for create offer
  const createForm = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      discountType: "percentage",
      discountValue: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: "upcoming",
    },
  })

  // Form setup for edit offer
  const editForm = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      discountType: "percentage",
      discountValue: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: "upcoming",
    },
  })

  // Watch form changes to detect unsaved changes
  const watchedCreateFields = createForm.watch()
  const watchedEditFields = editForm.watch()

  useEffect(() => {
    const hasCreateChanges = Object.values(watchedCreateFields).some((value) => {
      if (value instanceof Date) return true
      return value !== "" && value !== 0
    })
    const hasEditChanges = Object.values(watchedEditFields).some((value) => {
      if (value instanceof Date) return true
      return value !== "" && value !== 0
    })
    setHasUnsavedChanges(hasCreateChanges || hasEditChanges)
  }, [watchedCreateFields, watchedEditFields])

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Offer Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</div>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
      },
      {
        accessorKey: "discount",
        header: "Discount",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            <span>
              {row.original.discountType === "percentage"
                ? `${row.original.discountValue}%`
                : `₹${row.original.discountValue}`}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status")
          const statusColors = {
            upcoming: "bg-blue-100 text-blue-800",
            active: "bg-green-100 text-green-800",
            expired: "bg-gray-100 text-gray-800",
            inactive: "bg-red-100 text-red-800",
            paused: "bg-yellow-100 text-yellow-800",
          }
          return (
            <Badge variant="secondary" className={cn("capitalize", statusColors[status])}>
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="text-sm">{format(new Date(row.getValue("startDate")), "MMM d, yyyy")}</span>
          </div>
        ),
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-sm">{format(new Date(row.getValue("endDate")), "MMM d, yyyy")}</span>
          </div>
        ),
      },
    ],
    [],
  )

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/offers")

        if (response.data.success) {
          setOffers(response.data.offers || [])
        } else {
          toast.error(response.data.message || "Failed to fetch offers")
        }
      } catch (error) {
        toast.error("An error occurred while fetching offers")
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [axios])

  // Filter offers based on search
  const filteredOffers = useMemo(() => {
    if (!searchText) return offers
    return offers.filter(
      (offer) =>
        offer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchText.toLowerCase()) ||
        offer.type.toLowerCase().includes(searchText.toLowerCase()),
    )
  }, [offers, searchText])

  // Format date for input
  const formatDateForInput = (dateString) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd")
    } catch {
      return ""
    }
  }

  // Handle row click - open manage dialog
  const handleRowClick = (row) => {
    const offer = offers.find((o) => o._id === row.original._id)
    if (offer) {
      setSelectedOffer(offer)
      editForm.reset({
        name: offer.name,
        description: offer.description,
        type: offer.type,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        startDate: formatDateForInput(offer.startDate),
        endDate: formatDateForInput(offer.endDate),
        status: offer.status,
      })
      setIsManageDialogOpen(true)
    }
  }

  // Handle create offer
  const handleCreateOffer = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await axios.post("/offers", {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      })

      if (response.data.success) {
        setOffers((prev) => [response.data.offer, ...prev])
        toast.success("Offer created successfully")
        setIsCreateDialogOpen(false)
        createForm.reset()
        setHasUnsavedChanges(false)
      } else {
        toast.error(response.data.message || "Failed to create offer")
      }
    } catch (error) {
      toast.error("An error occurred while creating the offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit offer
  const handleEditOffer = async (data) => {
    if (!selectedOffer) return

    try {
      setIsSubmitting(true)
      const response = await axios.patch(`/offers/${selectedOffer._id}`, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      })

      if (response.data.success) {
        setOffers((prev) =>
          prev.map((offer) => (offer._id === selectedOffer._id ? { ...offer, ...response.data.offer } : offer)),
        )
        toast.success("Offer updated successfully")
        setIsManageDialogOpen(false)
        setSelectedOffer(null)
      } else {
        toast.error(response.data.message || "Failed to update offer")
      }
    } catch (error) {
      toast.error("An error occurred while updating the offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete offer
  const handleDeleteOffer = async () => {
    if (!selectedOffer) return

    try {
      setIsSubmitting(true)
      const response = await axios.delete(`/offers/${selectedOffer._id}`)

      if (response.data.success) {
        setOffers((prev) => prev.filter((offer) => offer._id !== selectedOffer._id))
        toast.success("Offer deleted successfully")
        setIsManageDialogOpen(false)
        setSelectedOffer(null)
      } else {
        toast.error(response.data.message || "Failed to delete offer")
      }
    } catch (error) {
      toast.error("An error occurred while deleting the offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog close with unsaved changes
  const handleCreateDialogClose = () => {
    if (hasUnsavedChanges) {
      setIsAlertDialogOpen(true)
    } else {
      setIsCreateDialogOpen(false)
    }
  }

  // Confirm close without saving
  const handleConfirmClose = () => {
    setIsCreateDialogOpen(false)
    setIsManageDialogOpen(false)
    setIsAlertDialogOpen(false)
    setSelectedOffer(null)
    createForm.reset()
    editForm.reset()
    setHasUnsavedChanges(false)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Offer Management</h1>
            <p className="text-muted-foreground">Create and manage promotional offers</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Offer
          </Button>
        </div>

        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search offers by name, description, or type..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          {searchText && (
            <button onClick={() => setSearchText("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOffers}
        isLoading={loading}
        pageSize={10}
        className="bg-white rounded-lg border"
        onRowClick={handleRowClick}
      />

      {/* Create Offer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>Create a new promotional offer for your platform</DialogDescription>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(handleCreateOffer)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offer Name */}
              <div className="space-y-2">
                <Label htmlFor="create-name">Offer Name *</Label>
                <Input
                  id="create-name"
                  placeholder="Enter offer name"
                  {...createForm.register("name")}
                  className={createForm.formState.errors.name ? "border-red-500" : ""}
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              {/* Offer Type */}
              <div className="space-y-2">
                <Label htmlFor="create-type">Offer Type *</Label>
                <Controller
                  name="type"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select offer type" />
                      </SelectTrigger>
                      <SelectContent className="[&_div]:cursor-pointer">
                        <SelectItem value="global">Global Discount</SelectItem>
                        <SelectItem value="course">Course Discount</SelectItem>
                        <SelectItem value="category">Category Discount</SelectItem>
                        <SelectItem value="instructor">Instructor Discount</SelectItem>
                        <SelectItem value="first-time">First Time User</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {createForm.formState.errors.type && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.type.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="create-description">Description *</Label>
              <Textarea
                id="create-description"
                placeholder="Enter offer description"
                rows={3}
                {...createForm.register("description")}
                className={createForm.formState.errors.description ? "border-red-500" : ""}
              />
              {createForm.formState.errors.description && (
                <p className="text-sm text-red-500">{createForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discount Type */}
              <div className="space-y-2">
                <Label htmlFor="create-discountType">Discount Type *</Label>
                <Controller
                  name="discountType"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {createForm.formState.errors.discountType && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.discountType.message}</p>
                )}
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="create-discountValue">Discount Value *</Label>
                <Input
                  id="create-discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter discount value"
                  {...createForm.register("discountValue", { valueAsNumber: true })}
                  className={createForm.formState.errors.discountValue ? "border-red-500" : ""}
                />
                {createForm.formState.errors.discountValue && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.discountValue.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Controller
                  name="startDate"
                  control={createForm.control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd") : field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={createForm.formState.errors.startDate ? "border-red-500" : ""}
                    />
                  )}
                />
                {createForm.formState.errors.startDate && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.startDate.message}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Controller
                  name="endDate"
                  control={createForm.control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd") : field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={createForm.formState.errors.endDate ? "border-red-500" : ""}
                    />
                  )}
                />
                {createForm.formState.errors.endDate && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="create-status">Status *</Label>
              <Controller
                name="status"
                control={createForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {createForm.formState.errors.status && (
                <p className="text-sm text-red-500">{createForm.formState.errors.status.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCreateDialogClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Offer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Offer Dialog (Edit/Delete) */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Offer</DialogTitle>
            <DialogDescription>Edit offer details or delete the offer.</DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <div className="space-y-6">
              {/* Edit Form */}
              <form onSubmit={editForm.handleSubmit(handleEditOffer)}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Offer Name</Label>
                      <Input
                        id="edit-name"
                        placeholder="Enter offer name"
                        {...editForm.register("name")}
                        className={editForm.formState.errors.name ? "border-red-500" : ""}
                      />
                      {editForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-type">Offer Type</Label>
                      <Controller
                        name="type"
                        control={editForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select offer type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="global">Global Discount</SelectItem>
                              <SelectItem value="course">Course Discount</SelectItem>
                              <SelectItem value="category">Category Discount</SelectItem>
                              <SelectItem value="instructor">Instructor Discount</SelectItem>
                              <SelectItem value="first-time">First Time User</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {editForm.formState.errors.type && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.type.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter offer description"
                      rows={3}
                      {...editForm.register("description")}
                      className={editForm.formState.errors.description ? "border-red-500" : ""}
                    />
                    {editForm.formState.errors.description && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-discountType">Discount Type</Label>
                      <Controller
                        name="discountType"
                        control={editForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="flat">Flat (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {editForm.formState.errors.discountType && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.discountType.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-discountValue">Discount Value</Label>
                      <Input
                        id="edit-discountValue"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter discount value"
                        {...editForm.register("discountValue", { valueAsNumber: true })}
                        className={editForm.formState.errors.discountValue ? "border-red-500" : ""}
                      />
                      {editForm.formState.errors.discountValue && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.discountValue.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-startDate">Start Date</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        {...editForm.register("startDate")}
                        className={editForm.formState.errors.startDate ? "border-red-500" : ""}
                      />
                      {editForm.formState.errors.startDate && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.startDate.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-endDate">End Date</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        {...editForm.register("endDate")}
                        className={editForm.formState.errors.endDate ? "border-red-500" : ""}
                      />
                      {editForm.formState.errors.endDate && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Controller
                      name="status"
                      control={editForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
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
                    Permanently delete this offer. This action cannot be undone.
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900">{selectedOffer.name}</p>
                      <p className="text-sm text-red-700 mt-1">
                        {selectedOffer.discountType === "percentage"
                          ? `${selectedOffer.discountValue}% discount`
                          : `₹${selectedOffer.discountValue} discount`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {selectedOffer.type}
                    </Badge>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteOffer}
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
                      Delete Offer
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
                setSelectedOffer(null)
              }}
              disabled={isSubmitting}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Alert Dialog */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving? All changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default OfferManagementPage
