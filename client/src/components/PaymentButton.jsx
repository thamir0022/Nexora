import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { Button } from "./ui/button"
import { CiCreditCard1 } from "react-icons/ci"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "./ui/alert-dialog"
import { useState } from "react"
import processingPayment from "@/assets/images/payment-processing.svg"
import paymentSuccess from "@/assets/images/payment-success.svg"
import paymentFailed from "@/assets/images/payment-failed.svg"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"

const PaymentButton = ({
  isCart = false,
  productIds, // Array of course IDs - replaces amount prop
  couponCode,
  walletAmount,
  description,
  icon = true,
  text = "Buy Now",
  className,
}) => {
  const [open, setOpen] = useState(false)
  const [verify, setVerify] = useState(null)
  const [paymentBreakdown, setPaymentBreakdown] = useState(null)
  const { user } = useAuth()
  const axios = useAxiosPrivate()
  const navigate = useNavigate()
  const { setCart } = useCart()

  const handlePayment = async () => {
    try {
      if (!user) {
        toast.error("Please login to continue")
        navigate(`/login?from=${window.location.pathname}`)
        return
      }

      const { fullName: name, email, mobile: contact } = user

      // Prepare payment data for backend calculation
      const paymentData = {
        isCart,
        ...(productIds && { course: productIds }), // Send course IDs for backend calculation
        ...(couponCode && { couponCode }),
        ...(walletAmount && walletAmount > 0 && { walletAmount }),
      }

      console.log("Creating order with data:", paymentData)

      // 1. Create order (backend calculates all amounts)
      const orderRes = await axios.post("/payment/order", paymentData)
      const { orderId, amount: orderAmount, currency, breakdown } = orderRes.data

      console.log("Order created:", { orderId, orderAmount, currency, breakdown })

      // Store breakdown for display
      setPaymentBreakdown(breakdown)

      // 2. Handle free orders (no payment needed)
      if (!breakdown.needsPayment || breakdown.finalAmount === 0) {
        setOpen(true)
        setVerify("pending")

        try {
          const verifyRes = await axios.post("/payment/verify", {
            isCart,
            course: productIds,
            couponCode,
            walletAmount,
            // No Razorpay details for free orders
          })

          if (isCart) {
            setCart([])
          }

          if (verifyRes.data.success) {
            setVerify("success")
            toast.success("Order processed successfully!")
          } else {
            setVerify("failed")
            toast.error("Order processing failed")
          }
        } catch (error) {
          console.error("Free order processing error:", error)
          setVerify("failed")
          toast.error("Order processing failed")
        }
        return
      }

      // 3. Handle paid orders with Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: orderAmount, // Already in paise from backend
        currency,
        name: "Nexora",
        description: description || `Payment for ${isCart ? "cart items" : "course"}`,
        order_id: orderId,
        handler: async (response) => {
          setOpen(true)
          setVerify("pending")

          try {
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isCart,
              course: productIds,
              couponCode,
              walletAmount,
            }

            const verifyRes = await axios.post("/payment/verify", verificationData)

            if (isCart) {
              setCart([])
            }

            if (verifyRes.data.success) {
              setVerify("success")
              toast.success("Payment successful!")
            } else {
              setVerify("failed")
              toast.error("Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            setVerify("failed")
            toast.error("Payment verification failed")
          }
        },
        prefill: {
          name,
          email,
          contact,
        },
        theme: {
          color: "#2b7fff",
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed")
          },
        },
      }

      const razorpayInstance = new window.Razorpay(options)
      razorpayInstance.open()

      razorpayInstance.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error)
        toast.error(`Payment failed: ${response.error.description}`)
      })
    } catch (err) {
      console.error("Payment error:", err)
      const errorMessage = err.response?.data?.message || "Something went wrong during payment"
      toast.error(errorMessage)
    }
  }

  const formatPrice = (price) => `₹${price.toLocaleString()}`

  const handleSuccessAction = () => {
    setOpen(false)
    if (isCart) {
      navigate("/my-courses")
    } else if (productIds && productIds.length === 1) {
      navigate(`/courses/${productIds[0]}`)
    } else {
      navigate("/my-courses")
    }
  }

  return (
    <>
      <Button
        onClick={handlePayment}
        className={cn(
          "inline-flex gap-0 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90",
          className,
        )}
      >
        {icon && <CiCreditCard1 className="mr-2 size-6" />}
        {text}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader className="flex flex-col items-center">
            <>
              {verify === "pending" && (
                <div className="bg-blue-100 rounded-full p-4">
                  <img src={processingPayment || "/placeholder.svg"} alt="Processing" className="w-44 h-32" />
                </div>
              )}
              {verify === "success" && (
                <div className="bg-green-100 rounded-full p-4">
                  <img src={paymentSuccess || "/placeholder.svg"} alt="Success" className="w-44 h-32" />
                </div>
              )}
              {verify === "failed" && (
                <div className="bg-red-100 rounded-full p-4">
                  <img src={paymentFailed || "/placeholder.svg"} alt="Failed" className="w-44 h-32" />
                </div>
              )}
            </>

            <AlertDialogTitle className={cn("text-2xl font-bold mb-2", verify === "pending" && "animate-pulse")}>
              {verify === "pending"
                ? "Processing Your Order"
                : verify === "success"
                  ? "Order Successful!"
                  : "Order Failed"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-gray-600 text-center max-w-md">
              {verify === "pending" && "Please wait while we process your order. This may take a moment..."}
              {verify === "success" && (
                <div>
                  <p className="mb-2">
                    Your order has been processed successfully! You now have access to{" "}
                    {isCart ? "your courses" : "the course"}.
                  </p>
                  {paymentBreakdown && (
                    <div className="text-sm text-left bg-gray-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between">
                        <span>Original Amount:</span>
                        <span>{formatPrice(paymentBreakdown.originalAmount)}</span>
                      </div>
                      {paymentBreakdown.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatPrice(paymentBreakdown.discountAmount)}</span>
                        </div>
                      )}
                      {paymentBreakdown.walletDeduction > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Wallet Used:</span>
                          <span>-{formatPrice(paymentBreakdown.walletDeduction)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                        <span>Final Amount:</span>
                        <span>{formatPrice(paymentBreakdown.finalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {verify === "failed" && "We couldn't process your order. Please check your details and try again."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="max-md:justify-center justify-end mt-6 gap-3">
            <AlertDialogCancel onClick={() => setOpen(false)}>
              {verify === "failed" ? "Try Again" : "Close"}
            </AlertDialogCancel>
            {verify === "success" && (
              <AlertDialogAction onClick={handleSuccessAction} className="bg-blue-600 hover:bg-blue-700">
                {isCart ? "View My Courses" : "Start Learning"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PaymentButton
