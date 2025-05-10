import Header from "@/components/Header";
import Thumbnail from "@/components/Thumbnail";
import { AnimatedGroup } from "@/components/ui/animated-group";
import axios from "@/config/axios";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setloading] = useState(false);

  const {user} = useAuth();
  const {token} = useAccessToken();

  console.log({user, token});

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
  }, []);

  return (
    <section className="w-dvw min-h-screen">
      <Header />
      {loading ? (
        <div className="min-h-[calc(100dvh-87px)] place-center">
          <Loader className="size-8 animate-spin" />
        </div>
      ) : (
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
              features
            }) => (
              <Thumbnail
                key={_id}
                title={title}
                description={description}
                thumbnailImage={thumbnailImage}
                features={features}
                rating={rating}
                category={category}
                instructor={instructor}
              />
            )
          )}
        </AnimatedGroup>
      )}
    </section>
  );
};

export default HomePage;
