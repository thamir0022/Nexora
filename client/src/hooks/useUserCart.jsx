import { useEffect, useState } from "react";
import useAxiosPrivate from "./useAxiosPrivate";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export const useUserCart = () => {
  const [isCartFetching, setIsCartFetching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const { user } = useAuth();
  const axios = useAxiosPrivate();

  const fetchCart = async () => {
    setIsCartFetching(true);
    try {
      const { data } = await axios.get(`/users/${user._id}/cart`);
      if (data.success) setCart(data.cart);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch cart";
      toast.error(errorMessage);
    } finally {
      setIsCartFetching(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    const calculateTotalPrice = () => {
      const total = cart.reduce((acc, item) => {
        return acc + item.price;
      }, 0);
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [cart]);

  const addToCart = async (courseId) => {
    setIsAdding(true);
    try {
      const { data } = await axios.post(`/users/${user._id}/cart/${courseId}`);
      if (data.success) {
        setCart((prev) => [...prev, data.course]);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to add course to cart";
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  console.log("cart at hook", cart);


  const removeFromCart = async (courseId) => {
    setIsRemoving(true);
    try {
      const res = await axios.delete(`/users/${user._id}/cart/${courseId}`);

      if (res.data.success) {
        setCart((prev) => prev.filter((item) => item._id !== courseId));
        toast.success("Course removed from cart");
      } else {
        toast.error(res.data.message || "Failed to remove course from cart");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove course from cart"
      );
    } finally {
      setIsAdding(false);
    }
  };

  return {
    isCartFetching,
    isAdding,
    isRemoving,
    cart,
    addToCart,
    fetchCart,
    removeFromCart,
    totalPrice,
  };
};
