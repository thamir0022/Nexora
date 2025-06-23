import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { Link } from 'react-router-dom';

export function CategorySlider({ categories }) {
  return (
    <div className="">
      <h2 className="text-center text-2xl font-semibold mt-4">Explore Categories</h2>
      <div className='relative h-40 w-full overflow-hidden'>
        <InfiniteSlider speedOnHover={20} className='flex h-full w-full items-center'>
          {categories.map((category) => (
            <Link key={category._id} to={`/courses?q=${encodeURIComponent(category.name)}`} className='flex items-center justify-center text-center w-52 px-4 py-2 border rounded-md bg-card hover:scale-110 transition-all duration-300'>
              <span className='font-semibold text-primary'>{category.name}</span>
            </Link>
          ))}
        </InfiniteSlider>
        <ProgressiveBlur
          className='pointer-events-none absolute top-0 left-0 h-full w-[200px]'
          direction='left'
          blurIntensity={1}
        />
        <ProgressiveBlur
          className='pointer-events-none absolute top-0 right-0 h-full w-[200px]'
          direction='right'
          blurIntensity={1}
        />
      </div>
    </div>
  );
}
