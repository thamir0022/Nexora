import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import Thumbnail from "@/components/Thumbnail";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { useAuth } from "@/hooks/useAuth";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { Loader } from "lucide-react";
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
        const res = await axios.get("/courses");

        if (res.status !== 200) {
          console.log(res.data);
        }

        setCourses(res.data.courses);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchCourses();
  }, [axios]);

  const handleAddToCart = async (courseId) => {
    console.log(courseId);
    try {
      const res = await axios.post(`/users/${user._id}/cart`, { courseId });

      if (!res.data.success) {
        const errorMessage =
          res.data?.message || "Failed to add course to cart";
        toast.error(errorMessage);
        return;
      }

      const message = res.data.message || "Course added to cart successfully";
      toast.success(message);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred";
      toast.error(errorMessage);
      console.log(error);
    }
  };

  return (
    <section className="w-dvw min-h-screen">
      <Header />
      {/* Hero Carousel */}
      <div className="w-11/12 max-w-7xl mx-auto">
        <HeroCarousel />
      </div>
      {loading ? (
        <div className="min-h-[calc(100dvh-87px)] place-center">
          <Loader className="size-8 animate-spin" />
        </div>
      ) : (
        <>
          <h2 className="text-center text-2xl font-semibold">
            Courses For You
          </h2>
          <AnimatedGroup
            preset="scale"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 px-5 md:px-10 py-3 md:py-7"
          >
            {courses.map(
              ({
                _id,
                title,
                description,
                thumbnailImage,
                rating,
                category,
                instructor,
                features,
                price,
              }) => (
                <Thumbnail
                  key={_id}
                  _id={_id}
                  title={title}
                  description={description}
                  thumbnailImage={thumbnailImage}
                  features={features}
                  rating={rating}
                  category={category}
                  instructor={instructor}
                  price={price}
                  addToCart={handleAddToCart}
                />
              )
            )}
          </AnimatedGroup>
        </>
      )}
    </section>
  );
};

export default HomePage;
