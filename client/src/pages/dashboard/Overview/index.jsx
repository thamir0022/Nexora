import { useAuth } from '@/hooks/useAuth';
import React from 'react'
import MyCourses from '../MyCoursePage/MyCourses';
import AdminOverview from './AdminOverview';
import { Navigate } from 'react-router-dom';
import InstructorOverview from './InstructorOverview';

const Overview = () => {
  const { user: { role } } = useAuth();

  switch (role) {
    case "student":
      return <MyCourses />
    case "instructor":
      return <InstructorOverview />
    case "admin":
      return <AdminOverview />
    default:
      return <Navigate to="/" />
  }
}

export default Overview