import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PlusCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Simplified Zod validation schema


const InstructorQualificationDialog = ({ name, open, setOpen, onSubmit }) => {
  



  

  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Hello, <span className="font-semibold">{name || "Instructor"}</span>! Great instructors start with great
            stories.
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center mt-1 text-sm">
            Share your professional journey to help us verify your expertise and connect you with learners.
          </DialogDescription>
        </DialogHeader>

        
      </DialogContent>
    </Dialog>
  )
}

export default InstructorQualificationDialog
