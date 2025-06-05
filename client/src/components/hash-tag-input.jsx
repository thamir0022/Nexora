import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Hash, Plus } from "lucide-react"
import { toast } from "sonner"

const HashtagInput = ({ hashtags = [], onChange, maxTags = 10, placeholder = "Add hashtag..." }) => {
  const [inputValue, setInputValue] = useState("")

  const addHashtag = () => {
    const trimmedValue = inputValue.trim().toLowerCase()

    if (!trimmedValue) return

    // Remove # if user typed it
    const cleanTag = trimmedValue.startsWith("#") ? trimmedValue.slice(1) : trimmedValue

    // Validation
    if (cleanTag.length < 2) {
      toast.error("Hashtag must be at least 2 characters long")
      return
    }

    if (cleanTag.length > 30) {
      toast.error("Hashtag must be less than 30 characters")
      return
    }

    if (hashtags.length >= maxTags) {
      toast.error(`Maximum ${maxTags} hashtags allowed`)
      return
    }

    if (hashtags.includes(cleanTag)) {
      toast.error("This hashtag already exists")
      return
    }

    // Add hashtag
    onChange([...hashtags, cleanTag])
    setInputValue("")
  }

  const removeHashtag = (tagToRemove) => {
    onChange(hashtags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addHashtag()
    } else if (e.key === "Backspace" && !inputValue && hashtags.length > 0) {
      // Remove last hashtag when backspace is pressed on empty input
      removeHashtag(hashtags[hashtags.length - 1])
    }
  }

  const handleInputChange = (e) => {
    let value = e.target.value

    // Prevent spaces and special characters except letters, numbers, and underscore
    value = value.replace(/[^a-zA-Z0-9_]/g, "")

    setInputValue(value)
  }

  return (
    <div className="space-y-3">
      {/* Input Section */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10"
            maxLength={30}
          />
        </div>
        <Button
          type="button"
          onClick={addHashtag}
          disabled={!inputValue.trim() || hashtags.length >= maxTags}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Hashtags Display */}
      {hashtags.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors group"
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  className="ml-2 text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove hashtag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {hashtags.length} of {maxTags} hashtags
            </span>
            <span>Press Enter to add • Backspace to remove</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {hashtags.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hashtags added yet</p>
          <p className="text-xs">Add hashtags to help students find your course</p>
        </div>
      )}
    </div>
  )
}

export default HashtagInput
