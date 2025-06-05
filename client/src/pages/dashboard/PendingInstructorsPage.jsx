import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/datatable/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useDebounce } from "use-debounce";

const PendingInstructorsPage = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch] = useDebounce(searchText, 500);
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  const fetchInstructors = async (searchQuery = "") => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/instructors/requests${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ""}`
      );

      if (response.data?.success) {
        setInstructors(response.data.pendingInstructors);
      } else {
        const message = response.data?.message || "Failed to fetch instructors";
        toast.error(message);
        setError(message);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
      const message = error.response?.data?.message || "Something went wrong";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors(debouncedSearch);
  }, [debouncedSearch]);

  const columns = [
    {
      accessorKey: "fullName",
      header: "Instructor",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <AvatarFallback>
              {row.original.fullName?.charAt(0)?.toUpperCase() || "I"}
            </AvatarFallback>
            <AvatarImage
              src={row.original.profilePicture}
              alt={row.original.fullName || "Instructor"}
            />
          </Avatar>
          <div>
            <p className="font-medium">{row.original.fullName || "N/A"}</p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "qualifications",
      header: "Qualifications",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.qualifications?.[0]?.qualifications?.length > 0 ? (
            <span className="text-muted-foreground">
              {row.original.qualifications[0].qualifications.length} submitted
            </span>
          ) : (
            <span className="text-muted-foreground">No qualifications</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "approved"
              ? "default"
              : row.original.status === "rejected"
                ? "destructive"
                : "secondary"
          }
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Applied On",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Instructor Requests Management</h2>
        <p className="text-muted-foreground">Manage instructor requests</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search instructor requests..."
            className="pl-8 w-full md:w-1/3"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={instructors}
        isLoading={loading}
        pageSize={10}
        onRowClick={(row) => navigate(`/dashboard/instructors/requests/${row.original._id}`)}
        rowClassName="cursor-pointer hover:bg-muted/50"
      />
    </div>
  );
};

export default PendingInstructorsPage;