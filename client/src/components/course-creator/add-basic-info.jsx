"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import axios from "@/config/axios"

const CourseBasicInfo = ({ courseData, updateCourseData }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState(courseData.categoryData || [])

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const response = await axios.get("/categories")
        if (response.data.success) {
          setCategories(response.data.data)

          // If we have category IDs but not category data, find and set the category data
          if (courseData.category?.length && !courseData.categoryData?.length) {
            const categoryData = response.data.data.filter((cat) => courseData.category.includes(cat._id))
            setSelectedCategories(categoryData)
            updateCourseData({ categoryData })
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    updateCourseData({ [name]: value })
  }

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId)

    if (!category) return

    // Check if already selected
    if (selectedCategories.some((cat) => cat._id === categoryId)) {
      // Remove from selection
      const updatedCategories = selectedCategories.filter((cat) => cat._id !== categoryId)
      setSelectedCategories(updatedCategories)

      // Update parent component with both ID array and full category data
      updateCourseData({
        category: updatedCategories.map((cat) => cat._id),
        categoryData: updatedCategories,
      })
    } else {
      // Add to selection
      const updatedCategories = [...selectedCategories, category]
      setSelectedCategories(updatedCategories)

      // Update parent component with both ID array and full category data
      updateCourseData({
        category: updatedCategories.map((cat) => cat._id),
        categoryData: updatedCategories,
      })
    }
  }

  // Remove category
  const removeCategory = (categoryId) => {
    const updatedCategories = selectedCategories.filter((cat) => cat._id !== categoryId)
    setSelectedCategories(updatedCategories)

    // Update parent component with both ID array and full category data
    updateCourseData({
      category: updatedCategories.map((cat) => cat._id),
      categoryData: updatedCategories,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Course Basic Information</h2>
        <p className="text-muted-foreground">Provide the essential details about your course</p>
      </div>

      <div className="grid gap-6">
        {/* Course Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input
            id="title"
            name="title"
            value={courseData.title}
            onChange={handleChange}
            placeholder="e.g., Mastering React.js with Projects"
            required
          />
        </div>

        {/* Course Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Course Description</Label>
          <Textarea
            id="description"
            name="description"
            value={courseData.description}
            onChange={handleChange}
            placeholder="Describe what students will learn in this course..."
            rows={4}
            required
          />
        </div>

        {/* Course Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Course Price ($)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={courseData.price}
            onChange={handleChange}
            placeholder="e.g., 49.99"
            required
          />
        </div>

        {/* Course Categories */}
        <div className="space-y-2">
          <Label htmlFor="category">Categories</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                {selectedCategories.length > 0
                  ? `${selectedCategories.length} categories selected`
                  : "Select categories..."}
                {loading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandList>
                  <CommandEmpty>No categories found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <CommandItem
                        key={category._id}
                        value={category.name}
                        onSelect={() => handleCategorySelect(category._id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCategories.some((cat) => cat._id === category._id) ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {category.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Display selected categories */}
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCategories.map((category) => (
              <Badge key={category._id} variant="secondary" className="px-3 py-1.5">
                {category.name}
                <button
                  type="button"
                  onClick={() => removeCategory(category._id)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${category.name} category`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseBasicInfo
