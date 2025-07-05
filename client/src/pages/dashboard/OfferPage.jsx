"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Search, X, Plus, Calendar, Percent, Clock, Loader2, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { DataTable } from "@/components/datatable/data-table"
import MultiSelectCombobox from "@/components/MultiselectCompobox"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

// Form validation helper
const validateForm = (data) => {
  const errors = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Offer name is required"
  } else if (data.name.length > 100) {
    errors.name = "Name must be less than 100 characters"
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Description is required"
  } else if (data.description.length > 500) {
    errors.description = "Description must be less than 500 characters"
  }

  if (!data.type) {
    errors.type = "Offer type is required"
  }

  if (!data.discountValue || data.discountValue <= 0) {
    errors.discountValue = "Discount value must be greater than 0"
  }

  if (!data.startDate) {
    errors.startDate = "Start date is required"
  }

  if (!data.endDate) {
    errors.endDate = "End date is required"
  }

  if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.endDate = "End date must be after start date"
  }

  return errors
}

// Offer Form Component
const OfferForm = ({
  form,
  onSubmit,
  isSubmitting,
  isEdit = false,
  onCancel,
  onDelete,
  user,
  formErrors,
  setFormErrors,
}) => {
  const [typeData, setTypeData] = useState({
    courses: [],
    categories: [],
    instructors: [],
  })
  const [loadingTypeData, setLoadingTypeData] = useState(false)
  const axios = useAxiosPrivate()

  const watchedType = form.watch("type")
  const watchedApplicableTo = form.watch("applicableTo") || []

  const isInstructor = user?.role === "instructor"

  const getAvailableOfferTypes = () => {
    if (isInstructor) {
      return [
        { value: "course", label: "Course Discount" },
        { value: "instructor", label: "Instructor Discount" },
      ]
    }
    return [
      { value: "global", label: "Global Discount" },
      { value: "course", label: "Course Discount" },
      { value: "category", label: "Category Discount" },
      { value: "instructor", label: "Instructor Discount" },
      { value: "first-time", label: "First Time User" },
    ]
  }

  const fetchTypeData = async (type) => {
    if (!["course", "category", "instructor"].includes(type)) return
    if (typeData[`${type}s`].length > 0) return

    setLoadingTypeData(true)
    try {
      let endpoint = ""
      switch (type) {
        case "course":
          endpoint = isInstructor ? `/courses/all?instructor=${user._id}` : "/courses/all"
          break
        case "category":
          endpoint = "/category"
          break
        case "instructor":
          endpoint = "/admin/users?role=instructor"
          break
      }

      const response = await axios.get(endpoint)
      if (response.data.success) {
        let fetchedData = []
        switch (type) {
          case "course":
            fetchedData = response.data.courses || response.data.data || []
            break
          case "category":
            fetchedData = response.data.categories || response.data.category || response.data.data || []
            break
          case "instructor":
            fetchedData = response.data.users || response.data.instructors || response.data.data || []
            break
          default:
            fetchedData = response.data[`${type}s`] || response.data.data || []
        }

        setTypeData((prev) => ({
          ...prev,
          [`${type}s`]: Array.isArray(fetchedData) ? fetchedData : [],
        }))
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} data:`, error)
      toast.error(`Failed to fetch ${type} data`)
    } finally {
      setLoadingTypeData(false)
    }
  }

  useEffect(() => {
    if (watchedType) {
      if (!isEdit) {
        form.setValue("applicableTo", [])
      }
      fetchTypeData(watchedType)
    }
  }, [watchedType, isEdit])

  const handleSubmit = (data) => {
    const errors = validateForm(data)
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      onSubmit(data)
    }
  }

  const renderApplicableToField = () => {
    if (watchedType === "instructor" && isInstructor) {
      return (
        <div className="space-y-2">
          <Label>Instructor</Label>
          <div className="p-2 bg-muted rounded-md">
            <span className="text-sm">This offer will be applied to your instructor profile automatically.</span>
          </div>
        </div>
      )
    }

    if (!["course", "category", "instructor"].includes(watchedType)) return null

    return (
      <div className="space-y-2">
        <Label>Select {watchedType}s *</Label>
        <MultiSelectCombobox
          data={typeData[`${watchedType}s`] || []}
          loading={loadingTypeData}
          selectedValues={watchedApplicableTo || []}
          onSelectionChange={(values) => {
            form.setValue("applicableTo", values)
          }}
          placeholder={`Select ${watchedType}s...`}
          type={watchedType}
        />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Offer Name *</Label>
          <Input
            placeholder="Enter offer name"
            {...form.register("name")}
            className={formErrors.name ? "border-red-500" : ""}
          />
          {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label>Offer Type *</Label>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select offer type" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOfferTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {formErrors.type && <p className="text-sm text-red-500">{formErrors.type}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          placeholder="Enter offer description"
          rows={3}
          {...form.register("description")}
          className={formErrors.description ? "border-red-500" : ""}
        />
        {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
      </div>

      {renderApplicableToField()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount Type *</Label>
          <Controller
            name="discountType"
            control={form.control}
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
        </div>

        <div className="space-y-2">
          <Label>Discount Value *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter discount value"
            {...form.register("discountValue", { valueAsNumber: true })}
            className={formErrors.discountValue ? "border-red-500" : ""}
          />
          {formErrors.discountValue && <p className="text-sm text-red-500">{formErrors.discountValue}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="date" {...form.register("startDate")} className={formErrors.startDate ? "border-red-500" : ""} />
          {formErrors.startDate && <p className="text-sm text-red-500">{formErrors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input type="date" {...form.register("endDate")} className={formErrors.endDate ? "border-red-500" : ""} />
          {formErrors.endDate && <p className="text-sm text-red-500">{formErrors.endDate}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status *</Label>
        <Controller
          name="status"
          control={form.control}
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
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Creating..."}
            </>
          ) : (
            <>
              {isEdit ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {isEdit ? "Save Changes" : "Create Offer"}
            </>
          )}
        </Button>
        {isEdit && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isSubmitting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}

const OfferManagementPage = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createFormErrors, setCreateFormErrors] = useState({})
  const [editFormErrors, setEditFormErrors] = useState({})
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: null,
    confirmText: "Confirm",
    confirmVariant: "default",
  })

  const axios = useAxiosPrivate()
  const { user } = useAuth()

  const isInstructor = user?.role === "instructor"

  // Form setup
  const createForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      type: "",
      discountType: "percentage",
      discountValue: 0,
      applicableTo: [],
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      status: "upcoming",
    },
  })

  const editForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      type: "",
      discountType: "percentage",
      discountValue: 0,
      applicableTo: [],
      startDate: "",
      endDate: "",
      status: "upcoming",
    },
  })

  // Table columns
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
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.getValue("type")}
          </Badge>
        ),
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
        const endpoint = isInstructor ? `/offers?instructor=${user._id}` : "/offers"
        const response = await axios.get(endpoint)


        if (response.data.success) {
          setOffers(response.data.offers || [])
        } else {
          toast.error(response.data.message || "Failed to fetch offers")
        }
      } catch (error) {
        console.error("Fetch offers error:", error)
        toast.error("An error occurred while fetching offers")
      } finally {
        setLoading(false)
      }
    }

    if (user?._id) {
      fetchOffers()
    }
  }, [axios, user, isInstructor])

  // Filter offers
  const filteredOffers = useMemo(() => {
    if (!searchText) return offers
    return offers.filter(
      (offer) =>
        offer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchText.toLowerCase()) ||
        offer.type.toLowerCase().includes(searchText.toLowerCase()),
    )
  }, [offers, searchText])

  console.log("Current offers:", offers) // Debug log
  console.log("Filtered offers:", filteredOffers) // Debug log

  // Utility functions
  const showAlert = (config) => {
    setAlertConfig({ ...config, open: true })
  }

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, open: false }))
  }

  const formatApplicableTo = (data, type) => {
    if (type === "instructor" && isInstructor) {
      return [
        {
          refModel: "Instructor",
          refId: user._id,
        },
      ]
    }

    if (!data.applicableTo?.length) return []

    const modelMap = {
      course: "Course",
      category: "Category",
      instructor: "Instructor",
    }

    return data.applicableTo.map((id) => ({
      refModel: modelMap[type],
      refId: id,
    }))
  }

  // Event handlers
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
        applicableTo: offer.applicableTo?.map((item) => item.refId) || [],
        startDate: format(new Date(offer.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(offer.endDate), "yyyy-MM-dd"),
        status: offer.status,
      })
      setEditFormErrors({})
      setIsManageDialogOpen(true)
    }
  }

  const handleCreateOffer = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await axios.post("/offers", {
        ...data,
        applicableTo: formatApplicableTo(data, data.type),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      })

      if (response.data.success) {
        setOffers((prev) => [response.data.offer, ...prev])
        toast.success("Offer created successfully")
        setIsCreateDialogOpen(false)
        createForm.reset()
        setCreateFormErrors({})
      } else {
        toast.error(response.data.message || "Failed to create offer")
      }
    } catch (error) {
      console.error("Create offer error:", error)
      toast.error("An error occurred while creating the offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditOffer = async (data) => {
    if (!selectedOffer) return

    try {
      setIsSubmitting(true)
      const response = await axios.patch(`/offers/${selectedOffer._id}`, {
        ...data,
        applicableTo: formatApplicableTo(data, data.type),
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
        setEditFormErrors({})
      } else {
        toast.error(response.data.message || "Failed to update offer")
      }
    } catch (error) {
      console.error("Edit offer error:", error)
      toast.error("An error occurred while updating the offer")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        closeAlert()
      } else {
        toast.error(response.data.message || "Failed to delete offer")
      }
    } catch (error) {
      console.error("Delete offer error:", error)
      toast.error("An error occurred while deleting the offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCancel = () => {
    const values = createForm.getValues()
    const hasChanges = Object.values(values).some((value) => {
      if (typeof value === "string") return value !== ""
      if (typeof value === "number") return value !== 0
      if (Array.isArray(value)) return value.length > 0
      return false
    })

    if (hasChanges) {
      showAlert({
        title: "Unsaved Changes",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        onConfirm: () => {
          setIsCreateDialogOpen(false)
          createForm.reset()
          setCreateFormErrors({})
          closeAlert()
        },
        confirmText: "Discard Changes",
        confirmVariant: "destructive",
      })
    } else {
      setIsCreateDialogOpen(false)
    }
  }

  const handleManageCancel = () => {
    setIsManageDialogOpen(false)
    setSelectedOffer(null)
    setEditFormErrors({})
  }

  const handleDeleteClick = () => {
    showAlert({
      title: "Delete Offer",
      description: `Are you sure you want to delete "${selectedOffer?.name}"? This action cannot be undone.`,
      onConfirm: handleDeleteOffer,
      confirmText: "Delete Offer",
      confirmVariant: "destructive",
    })
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isInstructor ? "My Offers" : "Offer Management"}</h1>
            <p className="text-muted-foreground">
              {isInstructor
                ? "Create and manage your course and instructor offers"
                : "Create and manage promotional offers"}
            </p>
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
            placeholder="Search offers..."
            className="pl-10 pr-10"
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
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              {isInstructor
                ? "Create a new promotional offer for your courses or instructor profile"
                : "Create a new promotional offer for your platform"}
            </DialogDescription>
          </DialogHeader>
          <OfferForm
            form={createForm}
            onSubmit={handleCreateOffer}
            isSubmitting={isSubmitting}
            onCancel={handleCreateCancel}
            user={user}
            formErrors={createFormErrors}
            setFormErrors={setCreateFormErrors}
          />
        </DialogContent>
      </Dialog>

      {/* Manage Offer Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Offer</DialogTitle>
            <DialogDescription>Edit offer details or delete the offer</DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <OfferForm
              form={editForm}
              onSubmit={handleEditOffer}
              isSubmitting={isSubmitting}
              isEdit={true}
              onCancel={handleManageCancel}
              onDelete={handleDeleteClick}
              user={user}
              formErrors={editFormErrors}
              setFormErrors={setEditFormErrors}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertConfig.open} onOpenChange={closeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={alertConfig.onConfirm}
              disabled={isSubmitting}
              className={alertConfig.confirmVariant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                alertConfig.confirmText
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default OfferManagementPage
