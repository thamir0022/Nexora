import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Loader2, AlertCircle, Check, Calendar, Percent, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { DataTable } from "@/components/datatable"

const discountTypes = ["percentage", "flat"]

// Validation schema
const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20, "Coupon code must be at most 20 characters")
    .regex(/^[A-Z0-9]+$/, "Coupon code must contain only uppercase letters and numbers"),
  discountType: z.enum(["percentage", "flat"], {
    errorMap: () => ({ message: "Discount type must be either percentage or flat" }),
  }),
  discountValue: z
    .number()
    .min(0.01, "Discount value must be greater than 0")
    .max(100000, "Discount value is too large"),
  minOrderAmount: z
    .number()
    .min(0, "Minimum order amount cannot be negative")
    .max(1000000, "Minimum order amount is too large"),
  maxDiscount: z
    .number()
    .min(0, "Maximum discount cannot be negative")
    .max(100000, "Maximum discount is too large")
    .optional(),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTill: z.string().min(1, "Valid till date is required"),
  usageLimitPerUser: z.number().min(1, "Usage limit must be at least 1").max(1000, "Usage limit is too high"),
})

const CouponManagementPage = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const axios = useAxiosPrivate()

  // Form setup for add coupon
  const addForm = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      validFrom: "",
      validTill: "",
      usageLimitPerUser: 1,
    },
  })

  // Form setup for edit coupon
  const editForm = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      validFrom: "",
      validTill: "",
      usageLimitPerUser: 1,
    },
  })

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Coupon Code",
        cell: ({ row }) => (
          <div className="font-mono font-medium bg-gray-100 px-2 py-1 rounded text-sm">{row.getValue("code")}</div>
        ),
      },
      {
        accessorKey: "discountType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            <div className="flex items-center gap-1">
              {row.getValue("discountType") === "percentage" ? (
                <Percent className="h-3 w-3" />
              ) : (
                <DollarSign className="h-3 w-3" />
              )}
              {row.getValue("discountType")}
            </div>
          </Badge>
        ),
      },
      {
        accessorKey: "discountValue",
        header: "Discount",
        cell: ({ row }) => {
          const type = row.original.discountType
          const value = row.getValue("discountValue")
          return <span className="font-medium">{type === "percentage" ? `${value}%` : `₹${value}`}</span>
        },
      },
      {
        accessorKey: "minOrderAmount",
        header: "Min Order",
        cell: ({ row }) => <span>₹{row.getValue("minOrderAmount")}</span>,
      },
      {
        accessorKey: "maxDiscount",
        header: "Max Discount",
        cell: ({ row }) => {
          const maxDiscount = row.getValue("maxDiscount")
          return <span>{maxDiscount ? `₹${maxDiscount}` : "No limit"}</span>
        },
      },
      {
        accessorKey: "validTill",
        header: "Expires",
        cell: ({ row }) => {
          const date = new Date(row.getValue("validTill"))
          const isExpired = date < new Date()
          return (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={`text-sm ${isExpired ? "text-red-500" : ""}`}>
                {formatDate(row.getValue("validTill"))}
              </span>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "usageLimitPerUser",
        header: "Usage Limit",
        cell: ({ row }) => <span>{row.getValue("usageLimitPerUser")} per user</span>,
      },
    ],
    [],
  )

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/admin/coupons")

        if (response.data.success) {
          setCoupons(response.data.coupons)
        } else {
          const errorMsg = response.data.message || "Failed to fetch coupons"
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred while fetching coupons"
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [axios])

  // Format date helper
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  // Format datetime for input
  const formatDateTimeForInput = (dateString) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd'T'HH:mm")
    } catch {
      return ""
    }
  }

  // Handle row click
  const handleRowClick = (couponId) => {
    const coupon = coupons.find((c) => c._id === couponId)
    if (coupon) {
      setSelectedCoupon(coupon)
      editForm.reset({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount || 0,
        validFrom: formatDateTimeForInput(coupon.validFrom),
        validTill: formatDateTimeForInput(coupon.validTill),
        usageLimitPerUser: coupon.usageLimitPerUser,
      })
      setIsManageDialogOpen(true)
    }
  }

  // Handle add coupon
  const handleAddCoupon = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await axios.post("/admin/coupons", {
        ...data,
        code: data.code.toUpperCase(),
        validFrom: new Date(data.validFrom).toISOString(),
        validTill: new Date(data.validTill).toISOString(),
      })

      if (response.data.success) {
        setCoupons((prev) => [response.data.coupon, ...prev])
        toast.success("Coupon created successfully")
        setIsAddDialogOpen(false)
        addForm.reset()
      } else {
        toast.error(response.data.message || "Failed to create coupon")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while creating the coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit coupon
  const handleEditCoupon = async (data) => {
    if (!selectedCoupon) return

    try {
      setIsSubmitting(true)
      const response = await axios.put(`/admin/coupons/${selectedCoupon._id}`, {
        ...data,
        code: data.code.toUpperCase(),
        validFrom: new Date(data.validFrom).toISOString(),
        validTill: new Date(data.validTill).toISOString(),
      })

      if (response.data.success) {
        setCoupons((prev) =>
          prev.map((coupon) => (coupon._id === selectedCoupon._id ? { ...coupon, ...response.data.coupon } : coupon)),
        )
        toast.success("Coupon updated successfully")
        setIsManageDialogOpen(false)
        setSelectedCoupon(null)
      } else {
        toast.error(response.data.message || "Failed to update coupon")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while updating the coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete coupon
  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return

    try {
      setIsSubmitting(true)
      const response = await axios.delete(`/admin/coupons/${selectedCoupon._id}`)

      if (response.data.success) {
        setCoupons((prev) => prev.filter((coupon) => coupon._id !== selectedCoupon._id))
        toast.success("Coupon deleted successfully")
        setIsManageDialogOpen(false)
        setSelectedCoupon(null)
      } else {
        toast.error(response.data.message || "Failed to delete coupon")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while deleting the coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading coupons...</span>
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
          <h2 className="text-3xl font-bold tracking-tight">Coupon Management</h2>
          <p className="text-muted-foreground mt-1">Create and manage discount coupons for your courses</p>
        </div>

        {/* Add Coupon Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>Create a new discount coupon for your courses.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(handleAddCoupon)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="add-code">Coupon Code</Label>
                    <Input
                      id="add-code"
                      placeholder="e.g., SAVE20"
                      className="font-mono"
                      {...addForm.register("code")}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                        addForm.setValue("code", value)
                      }}
                    />
                    {addForm.formState.errors.code && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.code.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="add-discountType">Discount Type</Label>
                    <Controller
                      name="discountType"
                      control={addForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                          <SelectContent>
                            {discountTypes.map((type) => (
                              <SelectItem key={type} value={type} className="capitalize">
                                <div className="flex items-center gap-2">
                                  {type === "percentage" ? (
                                    <Percent className="h-4 w-4" />
                                  ) : (
                                    <DollarSign className="h-4 w-4" />
                                  )}
                                  {type}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {addForm.formState.errors.discountType && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.discountType.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="add-discountValue">Discount Value</Label>
                    <Input
                      id="add-discountValue"
                      type="number"
                      step="0.01"
                      placeholder="10"
                      {...addForm.register("discountValue", { valueAsNumber: true })}
                    />
                    {addForm.formState.errors.discountValue && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.discountValue.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="add-minOrderAmount">Minimum Order Amount (₹)</Label>
                    <Input
                      id="add-minOrderAmount"
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      {...addForm.register("minOrderAmount", { valueAsNumber: true })}
                    />
                    {addForm.formState.errors.minOrderAmount && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.minOrderAmount.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="add-maxDiscount">Maximum Discount (₹)</Label>
                    <Input
                      id="add-maxDiscount"
                      type="number"
                      step="0.01"
                      placeholder="200 (optional)"
                      {...addForm.register("maxDiscount", { valueAsNumber: true })}
                    />
                    {addForm.formState.errors.maxDiscount && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.maxDiscount.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="add-usageLimitPerUser">Usage Limit Per User</Label>
                    <Input
                      id="add-usageLimitPerUser"
                      type="number"
                      placeholder="1"
                      {...addForm.register("usageLimitPerUser", { valueAsNumber: true })}
                    />
                    {addForm.formState.errors.usageLimitPerUser && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.usageLimitPerUser.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="add-validFrom">Valid From</Label>
                    <Input id="add-validFrom" type="datetime-local" {...addForm.register("validFrom")} />
                    {addForm.formState.errors.validFrom && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.validFrom.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="add-validTill">Valid Till</Label>
                    <Input id="add-validTill" type="datetime-local" {...addForm.register("validTill")} />
                    {addForm.formState.errors.validTill && (
                      <p className="text-sm text-red-500">{addForm.formState.errors.validTill.message}</p>
                    )}
                  </div>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Coupon
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons DataTable */}
      <DataTable
        columns={columns}
        data={coupons}
        pageSize={10}
        className="w-full"
        onRowClick={(row) => handleRowClick(row.original._id)}
      />

      {/* Manage Coupon Dialog (Edit/Delete) */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Coupon</DialogTitle>
            <DialogDescription>Edit coupon details or delete the coupon.</DialogDescription>
          </DialogHeader>

          {selectedCoupon && (
            <div className="space-y-6">
              {/* Edit Form */}
              <form onSubmit={editForm.handleSubmit(handleEditCoupon)}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-code">Coupon Code</Label>
                      <Input
                        id="edit-code"
                        placeholder="e.g., SAVE20"
                        className="font-mono"
                        {...editForm.register("code")}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                          editForm.setValue("code", value)
                        }}
                      />
                      {editForm.formState.errors.code && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.code.message}</p>
                      )}
                    </div>

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
                              {discountTypes.map((type) => (
                                <SelectItem key={type} value={type} className="capitalize">
                                  <div className="flex items-center gap-2">
                                    {type === "percentage" ? (
                                      <Percent className="h-4 w-4" />
                                    ) : (
                                      <DollarSign className="h-4 w-4" />
                                    )}
                                    {type}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {editForm.formState.errors.discountType && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.discountType.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-discountValue">Discount Value</Label>
                      <Input
                        id="edit-discountValue"
                        type="number"
                        step="0.01"
                        placeholder="10"
                        {...editForm.register("discountValue", { valueAsNumber: true })}
                      />
                      {editForm.formState.errors.discountValue && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.discountValue.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-minOrderAmount">Minimum Order Amount (₹)</Label>
                      <Input
                        id="edit-minOrderAmount"
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        {...editForm.register("minOrderAmount", { valueAsNumber: true })}
                      />
                      {editForm.formState.errors.minOrderAmount && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.minOrderAmount.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-maxDiscount">Maximum Discount (₹)</Label>
                      <Input
                        id="edit-maxDiscount"
                        type="number"
                        step="0.01"
                        placeholder="200 (optional)"
                        {...editForm.register("maxDiscount", { valueAsNumber: true })}
                      />
                      {editForm.formState.errors.maxDiscount && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.maxDiscount.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-usageLimitPerUser">Usage Limit Per User</Label>
                      <Input
                        id="edit-usageLimitPerUser"
                        type="number"
                        placeholder="1"
                        {...editForm.register("usageLimitPerUser", { valueAsNumber: true })}
                      />
                      {editForm.formState.errors.usageLimitPerUser && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.usageLimitPerUser.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-validFrom">Valid From</Label>
                      <Input id="edit-validFrom" type="datetime-local" {...editForm.register("validFrom")} />
                      {editForm.formState.errors.validFrom && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.validFrom.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-validTill">Valid Till</Label>
                      <Input id="edit-validTill" type="datetime-local" {...editForm.register("validTill")} />
                      {editForm.formState.errors.validTill && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.validTill.message}</p>
                      )}
                    </div>
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
                    Permanently delete this coupon. This action cannot be undone.
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-medium text-red-900">{selectedCoupon.code}</p>
                      <p className="text-sm text-red-700 mt-1">
                        {selectedCoupon.discountType === "percentage"
                          ? `${selectedCoupon.discountValue}% discount`
                          : `₹${selectedCoupon.discountValue} discount`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {selectedCoupon.discountType}
                    </Badge>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteCoupon}
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
                      Delete Coupon
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
                setSelectedCoupon(null)
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

export default CouponManagementPage
