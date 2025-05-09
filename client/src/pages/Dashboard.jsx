import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
      {tab === 'home' && <div>Home Content</div>}
      {tab === 'profile' && <div>Profile Content</div>} 
    </div>
  );
};

export default Dashboard;