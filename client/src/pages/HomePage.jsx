import HeroCarousel from "@/components/HeroCarousel";
import ThumbnailSkeleton from "@/components/skeltons/Thumbnail";
import Thumbnail from "@/components/Thumbnail";
import { useAuth } from "@/hooks/useAuth";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setloading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
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
