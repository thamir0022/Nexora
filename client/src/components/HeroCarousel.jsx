import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    id: 1,
    image: "/pexels-julia-m-cameron-4145355.jpg",
    title: "Expand Your Knowledge",
    subtitle: "Discover courses taught by industry experts",
    cta: "Explore Courses",
  },
  {
    id: 2,
    image: "/pexels-vanessa-loring-7869237.jpg",
    title: "Learn at Your Own Pace",
    subtitle: "Access content anytime, anywhere",
    cta: "Get Started",
  },
  {
    id: 3,
    image: "/pexels-julia-m-cameron-4144038.jpg",
    title: "Achieve Your Goals",
    subtitle: "Join thousands of successful students",
    cta: "Join Now",
  },
]

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [])

  // Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [nextSlide])

  return (
    <div className="relative max-xl:w-11/12 xl:max-w-7xl mx-auto  h-[500px] md:h-[600px] overflow-hidden rounded-2xl mt-9">
      {/* Slides */}
      <div className="relative size-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <img src={slide.image || "/placeholder.svg"} alt={slide.title} className="w-full h-full object-cover" />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-start p-8 md:p-16 z-20">
              <div className="">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{slide.title}</h1>
                <p className="text-lg md:text-xl text-white/90 mb-8">{slide.subtitle}</p>
                <Button size="lg" className="text-base px-8 py-6 h-auto">
                  {slide.cta}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors border border-white/10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors border border-white/10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroCarousel
