import { createContext, useContext, useState } from "react";

const cartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);

  const removeItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item._id !== itemId));
  };

  return (
    <cartContext.Provider
      value={{ cart, setCart, removeItem, openSheet, setOpenSheet }}
    >
      {children}
    </cartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(cartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default cartContext;
