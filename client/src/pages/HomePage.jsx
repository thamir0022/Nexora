import HeroCarousel from "@/components/HeroCarousel";
import ThumbnailSkeleton from "@/components/skeltons/Thumbnail";
import Thumbnail from "@/components/Thumbnail";
import { useAuth } from "@/hooks/useAuth";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setloading] = useState(false);
  const { user } = useAuth();
  const axios = useAxiosPrivate();

  useEffect(() => {
    const fetchCourses = async () => {
      setloading(true);
      try {
        const { data } = await axios.get("/courses");

        if (!data.success) {
          console.error('Failed to fetch courses:', data.message);
          toast.error('Failed to load courses. Please try again later.');
          return;
        }

        // Ensure we only show published courses
        const publishedCourses = data.courses.filter(course => course.status === 'published');
        setCourses(publishedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load courses';
        toast.error(errorMessage);
      } finally {
        setloading(false);
      }
    };
    fetchCourses();
  }, [axios]);

  const handleAddToCart = async (courseId) => {
    if (!user?._id) {
      toast.error('Please sign in to add courses to your cart');
      return;
    }

    try {
      const { data } = await axios.post(`/users/${user._id}/cart`, { courseId });

      if (!data.success) {
        const errorMessage = data?.message || "Failed to add course to cart";
        toast.error(errorMessage);
        return;
      }

      toast.success(data.message || "Course added to cart successfully");
    } catch (error) {
      console.error('Add to cart error:', error);
      const errorMessage = error.response?.data?.message || "Failed to add course to cart. Please try again.";

      if (error.response?.status === 401) {
        toast.error('Please sign in to add courses to your cart');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('already in cart')) {
        toast.error('This course is already in your cart');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <section className="w-dvw min-h-screen">
      {/* Hero Carousel */}
      <div className="w-11/12 max-w-7xl mx-auto">
        <HeroCarousel />
      </div>

      <h2 className="text-center text-2xl font-semibold mb-8">
        Courses For You
      </h2>

      <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <ThumbnailSkeleton key={i} />
          ))
        ) : courses?.length > 0 ? courses.map(
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
              addToCart={handleAddToCart}
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
