import React, { useState } from 'react'
import { dummyTrailers } from '../assets/assets'
import ReactPlayer from 'react-player'
import BlurCircle from './BlurCircle'
import { PlayCircleIcon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const TrailersSection = () => {

    const { shows, featuredMovie: appFeaturedMovie, image_base_url } = useAppContext()

    const featuredMovie = appFeaturedMovie || (shows && shows.length > 0 ? shows[0] : null);

    // Combine featured hero movie and available shows
    const allMovies = [];
    if (featuredMovie) {
        allMovies.push(featuredMovie);
    }
    if (shows && shows.length > 0) {
        shows.forEach(s => {
            if (!allMovies.some(m => String(m._id || m.id) === String(s._id || s.id))) {
                allMovies.push(s);
            }
        });
    }

    const trailerList = allMovies.length > 0 ? allMovies.map((movie, idx) => ({
        id: movie._id || movie.id || idx,
        title: movie.title,
        image: movie.backdrop_path 
            ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : (image_base_url || 'https://image.tmdb.org/t/p/w500') + movie.backdrop_path)
            : (dummyTrailers[idx % dummyTrailers.length].image),
        videoUrl: movie.trailer_url || dummyTrailers[idx % dummyTrailers.length].videoUrl
    })).slice(0, 6) : dummyTrailers.map((item, idx) => ({
        id: idx,
        title: `Movie Trailer ${idx + 1}`,
        image: item.image,
        videoUrl: item.videoUrl
    }));

    const [selectedTrailer, setSelectedTrailer] = useState(null);

    // Default current trailer to the home banner background movie
    const currentTrailer = selectedTrailer || trailerList[0] || {
        title: featuredMovie?.title || 'Featured Trailer',
        videoUrl: featuredMovie?.trailer_url || 'https://www.youtube.com/watch?v=WpW36ldAqnM'
    };

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
      <div className="flex items-center justify-between max-w-[960px] mx-auto mb-6">
        <p className='text-gray-300 font-medium text-xl'>Official Movie Trailers</p>
        {currentTrailer?.title && (
          <span className="text-sm text-primary font-medium">{currentTrailer.title}</span>
        )}
      </div>

      <div className='relative max-w-[960px] mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-black aspect-video'>
        <BlurCircle top='-100px' right='-100px'/>
        <ReactPlayer 
          url={currentTrailer?.videoUrl || 'https://www.youtube.com/watch?v=WpW36ldAqnM'} 
          controls={true} 
          playing={false}
          width="100%" 
          height="100%" 
        />
      </div>

      <div className='group flex flex-wrap justify-center gap-4 md:gap-6 mt-8 max-w-4xl mx-auto'>
        {trailerList.map((trailer)=>(
            <div 
              key={trailer.id || trailer.image} 
              className={`relative rounded-lg overflow-hidden group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition w-36 md:w-44 h-24 md:h-28 cursor-pointer border-2 ${
                currentTrailer?.videoUrl === trailer.videoUrl ? 'border-primary shadow-lg shadow-primary/30' : 'border-transparent'
              }`} 
              onClick={()=> setSelectedTrailer(trailer)}
            >
                <img src={trailer.image} alt={trailer.title || "trailer"} className='w-full h-full object-cover brightness-75'/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <PlayCircleIcon strokeWidth={1.8} className="w-8 h-8 text-white drop-shadow-md"/>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/80 px-2 py-1 text-[11px] font-medium text-white truncate text-center">
                    {trailer.title}
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}

export default TrailersSection
