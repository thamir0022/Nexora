import Profile from "@/components/Profile";
import { useAuth } from "@/hooks/useAuth";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const { user } = useAuth();
  const axios = useAxiosPrivate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/users/${user._id}`);

        if (!response.data.success) return toast.error(response.data.message);
        setUserData(response.data.user);
      } catch (error) {
        toast.error(error.message || "Failed to fetch user data");
      }
    };
    fetchUser();
  }, [user]);

  return (
    <section className="space-y-3 w-full">
      <h2 className="text-center text-2xl font-semibold">My Account</h2>
      {userData && <Profile user={userData} />}
    </section>
  );
};

export default AccountPage;
