import Profile from "@/components/Profile";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const AccountPage = () => {
  const [user, setuser] = useState();
  const axios = useAxiosPrivate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/users");

        if (!response.data.success) return toast.error(response.data.message);
        setuser(response.data.user);
      } catch (error) {
        toast.error(error.message || "Failed to fetch user data");
      }
    };
    fetchUser();
  }, []);

  return (
    <section className="space-y-3 w-1/2 mx-auto">
      <h2 className="text-center text-2xl font-semibold">My Account</h2>
      {user && <Profile user={user} />}
    </section>
  );
};

export default AccountPage;
