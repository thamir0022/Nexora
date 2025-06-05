"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { CiUser, CiMail, CiPhone, CiCalendar, CiLink, CiBookmark, CiFileOn } from "react-icons/ci";
import { FaExternalLinkAlt, FaArrowLeft } from "react-icons/fa";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { Briefcase, Shield } from "lucide-react";

const SingleUserPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const axios = useAxiosPrivate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [qualifications, setQualifications] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);

                // Fetch user data
                const userResponse = await axios.get(`/users/${userId}`);

                if (userResponse.data.success) {
                    setUserData(userResponse.data.user);

                    // Fetch qualifications if user is an instructor
                    if (userResponse.data.user.role === "instructor") {
                        try {
                            const qualResponse = await axios.get(`/instructors/qualifications/${userId}`);
                            if (qualResponse.data.success) {
                                setQualifications(qualResponse.data.qualifications);
                            }
                        } catch (error) {
                            console.error("Error fetching qualifications:", error);
                        }
                    }
                } else {
                    toast.error(userResponse.data.message || "Failed to fetch user data");
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("An error occurred while fetching user data");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    const handleStatusChange = async (value) => {
        if (!value || value === userData.status) return;

        try {
            setUpdatingStatus(true);
            const response = await axios.patch(`/users/${userId}`, { status: value });

            if (response.data.success) {
                setUserData({ ...userData, status: value });
                toast.success(`User status updated to ${value}`);
            } else {
                toast.error(response.data.message || "Failed to update user status");
            }
        } catch (error) {
            toast.error("An error occurred while updating user status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), "MMM d, yyyy, h:mm a");
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 space-y-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <FaArrowLeft className="h-3 w-3 mr-2" /> Back to Users
                </Button>
                <div className="grid gap-4">
                    <Skeleton className="h-12 w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="container mx-auto p-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <FaArrowLeft className="h-3 w-3 mr-2" /> Back to Users
                </Button>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">User not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <FaArrowLeft className="h-3 w-3 mr-2" /> Back to Users
            </Button>

            {/* Main User Profile Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={userData.profilePicture || "/placeholder.svg"} alt={userData.fullName} />
                            <AvatarFallback className="text-2xl">{userData.fullName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div>
                                        <h1 className="text-2xl font-bold">{userData.fullName}</h1>
                                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                            <CiMail className="h-4 w-4" />
                                            <span className="text-muted-foreground">{userData.email}</span>
                                            {userData.emailVerified && (
                                                <Badge variant="outline" className="ml-2">
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center md:items-end gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {userData.role}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Joined {format(new Date(userData.createdAt), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex gap-3">
                                <div className="flex flex-1 items-center gap-2">
                                    <CiUser className="h-5 w-5" />
                                    <div>
                                        <p className="text-sm font-medium">User ID</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{userData._id}</p>
                                    </div>
                                </div>

                                {userData.mobile && (
                                    <div className="flex flex-1 items-center gap-2">
                                        <CiPhone className="h-5 w-5" />
                                        <div>
                                            <p className="text-sm font-medium">Phone</p>
                                            <p className="text-xs text-muted-foreground">{userData.mobile}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-1 items-center gap-2">
                                    <ToggleGroup
                                        variant="outline"
                                        type="single"
                                        value={userData.status}
                                        onValueChange={handleStatusChange}
                                        disabled={updatingStatus}
                                        className="justify-start"
                                    >
                                        <ToggleGroupItem value="active" aria-label="Set status to active" className="capitalize">
                                            Active
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="suspended" aria-label="Set status to suspended" className="capitalize">
                                            Suspend
                                        </ToggleGroupItem>
                                        {userData.role === "instructor" && (
                                            <ToggleGroupItem value="pending" aria-label="Set status to pending" className="capitalize">
                                                Pending
                                            </ToggleGroupItem>
                                        )}
                                        {userData.role === "instructor" && (
                                            <ToggleGroupItem value="rejected" aria-label="Set status to rejected" className="capitalize">
                                                Reject
                                            </ToggleGroupItem>
                                        )}
                                    </ToggleGroup>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-11">
                    <TabsTrigger value="account" className="flex flex-1 items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Account</span>
                    </TabsTrigger>

                    {userData.role === "student" && (
                        <TabsTrigger value="courses" className="flex flex-1 items-center gap-2">
                            <CiBookmark className="h-4 w-4" />
                            <span>Enrolled Courses</span>
                        </TabsTrigger>
                    )}

                    {userData.role === "instructor" && (
                        <>
                            <TabsTrigger value="courses" className="flex flex-1 items-center gap-2">
                                <CiBookmark className="h-4 w-4" />
                                <span>Created Courses</span>
                            </TabsTrigger>
                            <TabsTrigger value="qualifications" className="flex flex-1 items-center gap-2">
                                <CiFileOn className="h-4 w-4" />
                                <span>Qualifications</span>
                            </TabsTrigger>
                        </>
                    )}

                    <TabsTrigger value="activity" className="flex flex-1 items-center gap-2">
                        <CiCalendar className="h-4 w-4" />
                        <span>Activity</span>
                    </TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Full Name</p>
                                    <p className="text-sm text-muted-foreground">{userData.fullName}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Email</p>
                                    <div className="flex flex-1 items-center gap-2">
                                        <p className="text-sm text-muted-foreground">{userData.email}</p>
                                        <Badge variant={userData.emailVerified ? "default" : "secondary"} className="text-xs">
                                            {userData.emailVerified ? "Verified" : "Unverified"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium">User ID</p>
                                    <p className="text-sm text-muted-foreground font-mono break-all">{userData._id}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Role</p>
                                    <p className="text-sm text-muted-foreground capitalize">{userData.role}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Created At</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(userData.createdAt)}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Last Updated</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(userData.updatedAt)}</p>
                                </div>

                                {userData.mobile && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Mobile</p>
                                        <div className="flex flex-1 items-center gap-2">
                                            <p className="text-sm text-muted-foreground">{userData.mobile}</p>
                                            <Badge variant={userData.mobileVerified ? "default" : "secondary"} className="text-xs">
                                                {userData.mobileVerified ? "Verified" : "Unverified"}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {userData.role === "student" ? "Enrolled Courses" : "Created Courses"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userData.role === "student" ? (
                                userData.enrolledCourses?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userData.enrolledCourses.map((course, index) => (
                                            <Card key={index}>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium">{course.title}</h3>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                                                        </div>
                                                        <Badge>{course.progress || 0}%</Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No enrolled courses found</p>
                                )
                            ) : userData.courses?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {userData.courses.map((course, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium">{course.title}</h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                                                    </div>
                                                    <Badge variant={course.status === "published" ? "default" : "secondary"} className="capitalize">
                                                        {course.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                                                    <span>Students: {course.enrolledStudents || 0}</span>
                                                    <span>Revenue: ₹{course.revenue || 0}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No courses found</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Qualifications Tab */}
                {userData.role === "instructor" && (
                    <TabsContent value="qualifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Instructor Qualifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {qualifications ? (
                                    <div className="space-y-6">
                                        {/* Experience Summary */}
                                        {qualifications.experienceSummary && (
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium flex flex-1 items-center gap-2">
                                                    <Briefcase className="h-4 w-4" /> Experience Summary
                                                </h3>
                                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                    {qualifications.experienceSummary}
                                                </p>
                                            </div>
                                        )}

                                        {/* Qualifications */}
                                        {qualifications.qualifications?.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium flex flex-1 items-center gap-2">
                                                    <CiFileOn className="h-4 w-4" /> Qualifications
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {qualifications.qualifications.map((qual, index) => (
                                                        <div key={index} className="p-3 border rounded-lg">
                                                            <p className="font-medium">{qual.degree}</p>
                                                            {qual.certificateURL && (
                                                                <a
                                                                    href={qual.certificateURL}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-primary flex items-center gap-1 mt-1"
                                                                >
                                                                    View Certificate <FaExternalLinkAlt className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Portfolio Link */}
                                        {qualifications.portfolioLink && (
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium flex flex-1 items-center gap-2">
                                                    <CiLink className="h-4 w-4" /> Portfolio
                                                </h3>
                                                <a
                                                    href={qualifications.portfolioLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary flex items-center gap-1"
                                                >
                                                    {qualifications.portfolioLink.replace(/^https?:\/\//, "")}
                                                    <FaExternalLinkAlt className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}

                                        {/* Social Links */}
                                        {qualifications.socialLinks?.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium">Social Links</h3>
                                                <div className="space-y-2">
                                                    {qualifications.socialLinks.map((link, index) => (
                                                        <div key={index} className="flex flex-1 items-center gap-2">
                                                            <span className="text-sm font-medium capitalize">{link.platform}:</span>
                                                            <a
                                                                href={link.profileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary text-sm flex items-center gap-1"
                                                            >
                                                                {link.profileUrl.replace(/^https?:\/\//, "")}
                                                                <FaExternalLinkAlt className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Application Status */}
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Application Status:</span>
                                                <Badge
                                                    variant={
                                                        qualifications.status === "approved"
                                                            ? "default"
                                                            : qualifications.status === "rejected"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className="capitalize"
                                                >
                                                    {qualifications.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last updated: {formatDate(qualifications.updatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No instructor qualifications available</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Activity Tab */}
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <CiCalendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-muted-foreground">No recent activity available</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SingleUserPage;
