import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CiCreditCard1 } from "react-icons/ci";

import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";

import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

import processingImg from "@/assets/images/payment-processing.svg";
import successImg from "@/assets/images/payment-success.svg";
import failedImg from "@/assets/images/payment-failed.svg";

const PaymentButton = ({
  isCart = false,
  course = [],
  amount,
  description,
  icon = false,
  text = "Buy",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [verify, setVerify] = useState(null);

  const { user } = useAuth();
  const { setCart } = useCart();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please login to continue");
      return navigate(`/login?from=${window.location.pathname}`);
    }

    try {
      const { data: order } = await axios.post("/payment/order", {
        amount,
        isCart,
        course,
      });

      launchRazorpay(order);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Something went wrong during payment"
      );
    }
  };

  const launchRazorpay = (order) => {
    const { orderId, amount, currency } = order;

    
  };

  const getDialogContent = () => {
    const images = {
      pending: processingImg,
      success: successImg,
      failed: failedImg,
    };

    const titles = {
      pending: "Processing Your Order",
      success: "Order Successful!",
      failed: "Order Failed",
    };

    return (
      <>
        <div className="rounded-full p-4 bg-muted">
          <img
            src={images[verify] || "/placeholder.svg"}
            alt={verify}
            className="w-44 h-32"
          />
        </div>
        <AlertDialogTitle
          className={cn(
            "text-2xl font-bold mb-2",
            verify === "pending" && "animate-pulse"
          )}
        >
          {titles[verify]}
        </AlertDialogTitle>
      </>
    );
  };

  const onSuccessNavigate = () => {
    setOpen(false);
    if (isCart || course.length > 1) navigate("/dashboard");
    else navigate(`/courses/${course[0]}`);
  };

  return (
    <>
      <Button
        onClick={handlePayment}
        className={cn(
          "inline-flex gap-0 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90",
          className
        )}
      >
        {icon && <CiCreditCard1 className="mr-2 size-6" />}
        {text}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader className="flex flex-col items-center">
            {getDialogContent()}
          </AlertDialogHeader>

          <AlertDialogFooter className="max-md:justify-center justify-end mt-6 gap-3">
            <AlertDialogCancel>
              {verify === "failed" ? "Try Again" : "Close"}
            </AlertDialogCancel>
            {verify === "success" && (
              <AlertDialogAction
                onClick={onSuccessNavigate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCart ? "View My Courses" : "Start Learning"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaymentButton;
