import HeroCarousel from "@/components/HeroCarousel";
import ThumbnailSkeleton from "@/components/skeltons/Thumbnail";
import Thumbnail from "@/components/Thumbnail";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const [courses, setCourses] = useState({ allCourses: [], userEnrolledCourses: [] });
  const [loading, setloading] = useState(false);
  const axios = useAxiosPrivate();
  const { cart, setCart, setOpenSheet } = useCart();
  const { wishlist, setWishlist } = useWishlist();
  const { user } = useAuth();
  const [loadingCourseId, setLoadingCourseId] = useState(null);
  const [wishlistProcessingId, setWishlistProcessingId] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [allCoursesRes, userEnrolledCoursesRes] = await Promise.all([
          axios.get("/courses"),
          axios.get(`/users/${user._id}/courses`)
        ]);
        // You can merge or use individually if needed
        setCourses({
          allCourses: allCoursesRes.data.courses,
          userEnrolledCourses: userEnrolledCoursesRes.data.courses,
        });
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };

    fetchCourses();
  }, [axios, user]);

  const handleAddToCart = async (courseId) => {
    setLoadingCourseId(courseId);
    try {
      const { data } = await axios.post(`/users/${user._id}/cart/${courseId}`);
      setCart(data.cart);
      toast.success("Course added to cart");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoadingCourseId(null);
    }
  };

  const handleAddToWishlist = async (courseId) => {
    setWishlistProcessingId(courseId);
    try {
      const { data } = await axios.post(`/users/${user._id}/wishlist/${courseId}`);
      setWishlist(data.wishlist);
      toast.success("Course added to wishlist");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add to wishlist");
    } finally {
      setWishlistProcessingId(null);
    }
  };

  const handleRemoveFromWishlist = async (courseId) => {
    setWishlistProcessingId(courseId);
    try {
      await axios.delete(`/users/${user._id}/wishlist/${courseId}`);
      setWishlist((prev) => prev.filter((item) => item._id !== courseId));
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove from wishlist");
    } finally {
      setWishlistProcessingId(null);
    }
  };

  return (
    <section className="container mx-auto">
      {/* Hero Carousel */}
      <HeroCarousel />

      <h2 className="text-center text-2xl font-semibold my-4">
        Explore Top-Rated Programs
      </h2>

      <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <ThumbnailSkeleton key={i} />
          ))
        ) : courses.allCourses.length > 0 ? courses.allCourses.map(
          ({
            _id,
            title,
            description,
            thumbnailImage,
            rating,
            category,
            instructor,
            price,
          }) => (
            <Thumbnail
              key={_id}
              _id={_id}
              title={title}
              description={description}
              thumbnailImage={thumbnailImage}
              rating={rating}
              category={category}
              instructor={instructor}
              price={price}
              role={user.role}
              isEnrolled={courses.userEnrolledCourses.some((item) => item.course === _id)}
              isInCart={cart.some((item) => item._id === _id)}
              isInWishlist={wishlist.some((item) => item._id === _id)}
              addingToCart={loadingCourseId === _id}
              modifyingWishlist={wishlistProcessingId === _id}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
              onRemoveFromWishlist={handleRemoveFromWishlist}
              openCart={() => setOpenSheet(true)}
            />
          )
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No courses available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomePage;
