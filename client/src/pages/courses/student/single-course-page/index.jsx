import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CoursePreviewPage from "./CoursePreviewPage";
import FullCoursePage from "./FullCoursePage";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import SingleCoursePageSkelton from "@/components/skeltons/SingleCoursePageSkelton";

const SingleCoursePage = () => {
    const { courseId } = useParams();
    const [hasAccess, setHasAccess] = useState(false);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const axios = useAxiosPrivate();

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`/courses/${courseId}`);
                setCourse(res.data.course);
                setHasAccess(res.data.hasAccess);
            } catch (err) {
                console.error("Failed to fetch course", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) return <SingleCoursePageSkelton />;

    return hasAccess ? (
        <FullCoursePage course={course} />
    ) : (
        <CoursePreviewPage course={course} />
    );
};

export default SingleCoursePage;
