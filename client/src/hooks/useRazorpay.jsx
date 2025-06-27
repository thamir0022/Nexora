import { useState } from "react";
import { toast } from "sonner";
import useAxiosPrivate from "./useAxiosPrivate";
import { useAuth } from "./useAuth";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";

const useRazorpay = () => {
  const [paymentState, setPaymentState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const axios = useAxiosPrivate();
  const { user } = useAuth();
  const { setCart } = useCart();

  const navigate = useNavigate();

  const initiatePayment = async (orderData) => {
    if (!user) {
      toast.error("Please login to continue");
      return navigate(`/sign-in?from=${window.location.pathname}`);
    }

    const { amount, isCart, course } = orderData;

    try {
      setIsProcessing(true);

      // Create order
      const { data: order } = await axios.post("/payment/order", { amount });

      // Launch Razorpay
      launchRazorpay(order, { isCart, course });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create order");
    } finally {
      setIsProcessing(false);
    }
  };

  const launchRazorpay = (order, orderData) => {
    const { orderId, amount, currency } = order;
    const { isCart, course } = orderData;

    console.log({order, orderData});

    const razorpay = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount,
      currency,
      name: "Nexora",
      description: `Payment for ${isCart ? "cart items" : "course"}`,
      order_id: orderId,

      handler: async (response) => {
        await verifyPayment({
          ...response,
          isCart,
          course,
          amount
        });
      },

      prefill: {
        name: user?.fullName || "",
        email: user?.email || "",
        contact: user?.mobile || "",
      },

      theme: { color: "#2b7fff" },

      modal: {
        ondismiss: () => setPaymentState(null),
      },
    });

    razorpay.on("payment.failed", (response) => {
      setPaymentState("failed");
      toast.error(`Payment failed: ${response.error.description}`);
    });

    razorpay.open();
  };

  const verifyPayment = async (paymentData) => {
    console.log(paymentData);
    try {
      setPaymentState("pending");

      const res = await axios.post("/payment/verify", paymentData);

      toast(res.data.message || "Payment verified successfully");

      const url = paymentData.isCart ? "/dashboard" : `/courses/${paymentData.course}`;
      
      setTimeout(() => {
        navigate(url);
      }, 3000);

      if (paymentData.isCart) {
        setCart([]);
      }

      setPaymentState("success");
    } catch (error) {
      setPaymentState("failed");
      toast.error(error.message || "Payment verification failed");
    }
  };

  const resetPaymentState = () => setPaymentState(null);

  return {
    paymentState,
    isProcessing,
    initiatePayment,
    resetPaymentState,
  };
};

export default useRazorpay;
