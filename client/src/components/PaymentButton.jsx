import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import React from "react";
import { Button } from "./ui/button";
import { CiCreditCard1 } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogDescription } from "./ui/alert-dialog";
import { useState } from "react";
import processingPayment from "@/assets/images/payment-processing.svg";
import paymentSuccess from "@/assets/images/payment-success.svg";
import paymentFailed from "@/assets/images/payment-failed.svg";
import { cn } from "@/lib/utils";

const PaymentButton = ({ isCart = false, amount, couponCode, description, course, icon, text = "Buy Now", className }) => {
  const [open, setOpen] = useState(false);
  const [verify, setVerify] = useState(null);
  const { user } = useAuth();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  const handlePayment = async () => {
    try {
      if (!user) {
        toast.error("Please login to continue");
        navigate(`/login?from=${window.location.pathname}`);
        return;
      }

      const { fullName: name, email, mobile: contact } = user;

      // 1. Create Razorpay Order on backend
      const orderRes = await axios.post("/payment/order", { amount, isCart, couponCode });
      const { orderId, amount: orderAmount, currency } = orderRes.data;

      // 2. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: orderAmount,
        currency,
        name: "Nexora",
        description,
        order_id: orderId,
        handler: async (response) => {
          setOpen(true);
          setVerify("pending");
          // 3. On success, verify payment on backend
          const verifyRes = await axios.post("/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            isCart,
            user,
            course,
            amount: orderAmount / 100,
            couponCode
          });

          const verifyData = verifyRes.data;
          if (verifyData.success) {
            setVerify("success");
          } else {
            setVerify("failed");
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
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Something went wrong during payment");
    }
  };

  return (
    <>
      {/* {isLoading ? <Skeleton className="w-full h-12 rounded-md bg-gradient-to-r from-blue-100 to-blue-200"></Skeleton> : */}
        <Button
          onClick={handlePayment}
          className={cn("inline-flex gap-0 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90", className)}
        >
          {icon && <CiCreditCard1 className="mr-2 size-6!" />}
          {text}
        </Button>
      {/* } */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader className="flex flex-col items-center">
            <>
              {verify === "pending" && (
                <div className="bg-blue-100 rounded-full p-4">
                  <img src={processingPayment} alt="Processing" className="w-44 h-32" />
                </div>
              )}
              {verify === "success" && (
                <div className="bg-green-100 rounded-full p-4">
                  <img src={paymentSuccess} alt="Success" className="w-44 h-32" />
                </div>
              )}
              {verify === "failed" && (
                <div className="bg-red-100 rounded-full p-4">
                  <img src={paymentFailed} alt="Failed" className="w-44 h-32" />
                </div>
              )}
            </>

            <AlertDialogTitle className={cn("text-2xl font-bold mb-2", verify === "pending" && "animate-pulse")}>
              {verify === "pending"
                ? "Processing Your Payment"
                : verify === "success"
                  ? "Payment Successful!"
                  : "Payment Failed"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-gray-600 text-center max-w-md">
              {verify === "pending" &&
                "Please wait while we process your payment. This may take a moment..."}
              {verify === "success" &&
                `Payment of ₹${amount} was successful. You now have full access to the course.`}
              {verify === "failed" &&
                "We couldn't process your payment. Please check your payment details and try again."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="max-md:justify-center justify-end mt-6 gap-3">
            <AlertDialogCancel>
              {verify === "failed" ? "Try Again" : "Close"}
            </AlertDialogCancel>
            {verify === "success" && (
              <AlertDialogAction
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Learning
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
};

export default PaymentButton;
