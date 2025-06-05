import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Plus, GripVertical } from "lucide-react"
import { Reorder } from "framer-motion"

const CourseFeaturesStep = ({ courseData, updateCourseData }) => {
  const [featureInput, setFeatureInput] = useState("")
  const features = courseData.features || []

  const updateFeatures = (newFeatures) => {
    updateCourseData({ features: newFeatures })
  }

  const addFeature = () => {
    if (featureInput.trim()) {
      updateFeatures([...features, featureInput.trim()])
      setFeatureInput("")
    }
  }

  const removeFeature = (index) => {
    const newFeatures = features.filter((_, i) => i !== index)
    updateFeatures(newFeatures)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addFeature()
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Course Features</h2>
        <p className="text-muted-foreground">Add key features that make your course stand out</p>
      </div>

      {/* Add Feature Input */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label htmlFor="feature">Add Feature</Label>
          <div className="flex gap-2">
            <Input
              id="feature"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 50+ HD video lectures"
              className="flex-1"
            />
            <Button onClick={addFeature} disabled={!featureInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Press Enter or click + to add</p>
        </div>
      </Card>

      {/* Features List */}
      <Card className="p-4">
        <Label className="text-base font-medium">Course Features ({features.length})</Label>

        {features.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No features added yet</p>
            <p className="text-sm">Add features to highlight what makes your course special</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={features} onReorder={updateFeatures} className="space-y-2 mt-3">
            {features.map((feature, index) => (
              <Reorder.Item
                key={feature}
                value={feature}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-move group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{feature}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </Card>
    </div>
  )
}

export default CourseFeaturesStep
