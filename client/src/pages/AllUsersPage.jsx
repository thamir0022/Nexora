import UsersTable from "@/components/UserDataTable";
import React from "react";

const AllUsersPage = () => {
  return (
    <section className="">
      <h1 className="text-3xl text-center mb-10">User Management</h1>
      <UsersTable />
    </section>
  );
};

export default AllUsersPage;
