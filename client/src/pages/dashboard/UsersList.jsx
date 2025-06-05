import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { DataTable } from "@/components/datatable/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch] = useDebounce(searchText, 500);
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  const fetchUsers = async (searchQuery = "") => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/admin/users${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`
      );

      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        toast.error(response.data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(debouncedSearch);
  }, [debouncedSearch]);

  const columns = [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <AvatarFallback>{row.original.fullName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            <AvatarImage src={row.original.profilePicture || "/placeholder.svg"} alt={row.original.fullName || "User"} />
          </Avatar>
          <div>
            <p className="font-medium">{row.original.fullName || "N/A"}</p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.role === "admin"
          ? "bg-red-100 text-red-800"
          : row.original.role === "instructor"
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
          }`}>
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === "active"
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
          }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => row.original.mobile || "N/A",
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-2 mb-8">
      <h1 className="text-2xl font-bold">User Management</h1>
      <p className="text-muted-foreground">Manage users and their details</p>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search users by name or email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        pageSize={10}
        className="bg-white rounded-lg border"
        onRowClick={(row) => navigate(`/dashboard/users/${row.original._id}`)}
      />
    </div>
  );
};

export default UsersList
