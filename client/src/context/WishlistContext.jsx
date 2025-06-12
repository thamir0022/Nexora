import { createContext, useContext, useState } from "react";

const wishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);

  const removeItem = (itemId) => {
    setWishlist((prev) => prev.filter((item) => item._id !== itemId));
  };

  return (
    <wishlistContext.Provider
      value={{ wishlist, setWishlist, removeItem, openSheet, setOpenSheet }}
    >
      {children}
    </wishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(wishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export default wishlistContext;
