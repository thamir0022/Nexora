"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, GripVertical } from "lucide-react"
import { Reorder } from "framer-motion"

const CourseFeaturesStep = ({ courseData, updateCourseData }) => {
  const [featureInput, setFeatureInput] = useState("")
  const [features, setFeatures] = useState(courseData.features || [])

  // Update parent component when features change
  const updateFeatures = (newFeatures) => {
    setFeatures(newFeatures)
    updateCourseData({ features: newFeatures })
  }

  // Handle feature input
  const handleFeatureKeyDown = (e) => {
    if (e.key === "Enter" && featureInput.trim()) {
      e.preventDefault()
      updateFeatures([...features, featureInput.trim()])
      setFeatureInput("")
    }
  }

  // Add feature
  const addFeature = () => {
    if (featureInput.trim()) {
      updateFeatures([...features, featureInput.trim()])
      setFeatureInput("")
    }
  }

  // Remove feature
  const removeFeature = (index) => {
    const newFeatures = [...features]
    newFeatures.splice(index, 1)
    updateFeatures(newFeatures)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Course Features</h2>
        <p className="text-muted-foreground">Add key features that make your course stand out</p>
      </div>

      <div className="space-y-6">
        {/* Feature Input */}
        <div className="space-y-2">
          <Label htmlFor="feature">Add Feature</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="feature"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={handleFeatureKeyDown}
              placeholder="e.g., 50+ HD video lectures"
            />
            <button
              type="button"
              onClick={addFeature}
              className="p-2 rounded-md bg-primary text-primary-foreground"
              aria-label="Add feature"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Press Enter to add multiple features</p>
        </div>

        {/* Feature List */}
        <div className="space-y-2">
          <Label>Course Features</Label>
          <div className="border rounded-md p-4 min-h-[200px]">
            {features.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No features added yet. Add some features to make your course stand out.
              </p>
            ) : (
              <Reorder.Group axis="y" values={features} onReorder={updateFeatures} className="space-y-2">
                {features.map((feature, index) => (
                  <Reorder.Item
                    key={feature}
                    value={feature}
                    as="div"
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-md cursor-move"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-grow">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-1 rounded-full hover:bg-muted"
                      aria-label={`Remove feature: ${feature}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Drag and drop to reorder features</p>
        </div>
      </div>
    </div>
  )
}

export default CourseFeaturesStep
