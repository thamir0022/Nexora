import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FullCoursePage = ({ course }) => {
	return (
		<div className="h-dvh p-5 grid grid-cols-3 gap-4">
			{/* First Card: spans 2 columns */}
			<div className="col-span-2 space-y-4">
				<Card className="aspect-video w-full" />

				{/* Tabs below the first card, same width */}
				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="w-full ">
						<TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
						<TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
						<TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
					</TabsList>
					<TabsContent value="overview">Full Course Overview</TabsContent>
					<TabsContent value="resources">Full Course Resources</TabsContent>
					<TabsContent value="summary">Full Course Summary</TabsContent>
				</Tabs>
			</div>

			{/* Second Card: on the right side */}
			<Card />
		</div>

	)
}

export default FullCoursePage;