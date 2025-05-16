import CoursesList from '@/components/CourseList';
import UsersTable from '@/components/UserDataTable';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AccountPage from './AccountPage';
import PendingInstructorsPage from './PendingInstructorsPage';

const Dashboard = () => {
  const [tab, setTab] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setTab(tabParam);
    }
  }, [searchParams]);


  return (
    <div className="">
      {tab === 'courses' && <CoursesList/>} 
      {tab === 'users' && <UsersTable/>} 
      {tab === 'account' && <AccountPage/>} 
      {tab === 'pending-instructors' && <PendingInstructorsPage/>} 
    </div>
  );
};

export default Dashboard;