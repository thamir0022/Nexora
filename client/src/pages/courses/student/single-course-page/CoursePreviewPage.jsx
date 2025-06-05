import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

const CoursePreviewPage = ({ course }) => {
  return (
    <div className="min-h-dvh p-5 mt-3">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video */}
          <div style={{backgroundImage: `url(${course.thumbnailImage})`}} className="bg-cover bg-center rounded-xl border w-full aspect-video overflow-hidden shadow-md"/>
          {/* Title */}
          <h1 className="text-2xl font-semibold">{course.title}</h1>

          {/* Instructor */}
          <Link to="#" className="w-fit flex items-center gap-2">
            <Avatar>
              <AvatarImage src={course.instructor.profilePicture} />
              <AvatarFallback>{course.instructor.fullName[0]}</AvatarFallback>
            </Avatar>
            <span>{course.instructor.fullName}</span>
          </Link>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full h-11">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="lessons" className="flex-1 lg:hidden">Lessons</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="flex items-center gap-2">
                <span>Rating</span>
                <StarRating value={course.rating.averageRating} readonly />
                <span>{course.rating.ratingCount}</span>
              </div>
              <p>{course.description}</p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">Course Features</h2>
              <ul className="space-y-2">
                {course.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    ✨
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="lessons">Course Lessons</TabsContent>
            <TabsContent value="reviews">Course Reviews</TabsContent>
          </Tabs>
        </div>

        {/* Right-Side Sticky Card */}
        <div className="max-lg:hidden">
          <Card className="sticky top-0 h-dvh">
            <CardHeader>
              <CardTitle className="text-lg text-center">Lessons</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-2">
              {course.lessons.map((lesson, index) => (
                <>
                  <div key={index} className="flex items-center gap-2">
                    <img className='w-24 rounded-sm shadow-sm' src={lesson.thumbnailImage} alt={lesson.title} />
                    <h2>{lesson.title}</h2>
                  </div>
                  {index !== course.lessons.length - 1 && <Separator />}
                </>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoursePreviewPage;
