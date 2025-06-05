import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogContainer,
} from "@/components/motion-primitives/morphing-dialog"
import { XIcon } from "lucide-react"

export const CertificatePreview = ({ imageUrl, alt }) => {
  return (
    <MorphingDialog
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <MorphingDialogTrigger>
        <div className="group cursor-pointer">
          <MorphingDialogImage
            src={imageUrl || "/placeholder.svg?height=80&width=120"}
            alt={alt}
            className="w-20 h-16 object-cover rounded-lg border-2 border-border shadow-sm transition-all group-hover:shadow-md group-hover:scale-105"
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">Click to view</p>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative">
          <MorphingDialogImage
            src={imageUrl || "/placeholder.svg?height=600&width=800"}
            alt={alt}
            className="h-auto w-full max-w-[90vw] rounded-[4px] object-contain lg:h-[90vh]"
          />
        </MorphingDialogContent>
        <MorphingDialogClose
          className="fixed right-6 top-6 h-fit w-fit rounded-full bg-white p-1 shadow-lg"
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { delay: 0.3, duration: 0.1 },
            },
            exit: { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <XIcon className="h-5 w-5 text-zinc-500" />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}
