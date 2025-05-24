import { CardFooter } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { format } from "date-fns";
import { Loader2, Check, X, ExternalLink, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const PendingInstructorsPage = () => {
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const axios = useAxiosPrivate();

  useEffect(() => {
    const fetchPendingInstructors = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/instructors/requests");

        if (!res.data?.success) {
          const message = res.data?.message || "Something went wrong";
          toast.error(message);
          setError(message);
          return;
        }

        setPendingInstructors(res.data.pendingInstructors);
      } catch (error) {
        console.error(error);
        const message = error.response?.data?.message || "Something went wrong";
        toast.error(message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingInstructors();
  }, [axios]);

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  // Filter instructors based on search query
  const filteredInstructors = pendingInstructors.filter((instructor) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      instructor.fullName?.toLowerCase().includes(searchLower) ||
      instructor.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pending Instructor Requests</h1>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Instructor Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Instructor Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage instructor applications
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {pendingInstructors.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle>Instructor Applications</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingInstructors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Check className="h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No Pending Requests
              </h2>
              <p className="text-muted-foreground">
                All instructor requests have been processed.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Qualifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstructors.map((instructor) => (
                    <TableRow
                      key={instructor._id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {instructor.fullName}
                      </TableCell>
                      <TableCell>{instructor.email}</TableCell>
                      <TableCell>{formatDate(instructor.createdAt)}</TableCell>
                      <TableCell>
                        {instructor.qualifications &&
                        instructor.qualifications.length > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {instructor.qualifications[0].qualifications
                              ?.length || 0}{" "}
                            Submitted
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            None
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            instructor.status === "rejected"
                              ? "bg-red-100 border-red-300"
                              : instructor.status === "pending" &&
                                "bg-yellow-100 border-yellow-300"
                          } capitalize`}
                        >
                          {instructor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() =>
                            navigate(
                              `/dashboard/instructors/requests/${instructor._id}`
                            )
                          }
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingInstructorsPage;
