import React, { useState } from 'react'
import { ArrowRight, CalendarIcon, ClockIcon, PlayIcon, XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import timeFormat from '../lib/timeFormat'
import ReactPlayer from 'react-player'

const TMDB_GENRES_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

const HeroSection = () => {

    const navigate = useNavigate()
    const { shows, featuredMovie: appFeaturedMovie, image_base_url } = useAppContext()
    const [showTrailerModal, setShowTrailerModal] = useState(false)

    const featuredMovie = appFeaturedMovie || (shows && shows.length > 0 ? shows[0] : null)

    const getImageUrl = (path) => {
        if (!path) return '/backgroundImage.png'
        if (path.startsWith('http')) return path.replace('/original/', '/w1280/')
        const baseUrl = image_base_url || 'https://image.tmdb.org/t/p/w1280'
        return baseUrl.replace('/original/', '/w1280/') + path
    }

    const bgImage = getImageUrl(featuredMovie?.backdrop_path)

    const formatGenres = (genres) => {
        if (!genres || genres.length === 0) return "Action | Drama";
        return genres.map(g => {
            if (typeof g === 'string') return g;
            if (typeof g === 'object' && g.name) return g.name;
            if (typeof g === 'number' && TMDB_GENRES_MAP[g]) return TMDB_GENRES_MAP[g];
            return null;
        }).filter(Boolean).join(" | ") || "Action | Drama";
    }

    const trailerUrl = featuredMovie?.trailer_url || 'https://www.youtube.com/watch?v=WpW36ldAqnM'

  return (
    <div 
      className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen relative'
      style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.88), rgba(0,0,0,0.4)), url(${bgImage})` }}
    >
      <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110 text-white mt-12'>
        {featuredMovie ? featuredMovie.title : 'Featured Movie'}
      </h1>

      <div className='flex items-center gap-4 text-gray-300 flex-wrap text-sm md:text-base'>
        <span className="bg-primary/30 text-white px-3 py-1 rounded-full text-xs font-medium border border-primary/40">
          {formatGenres(featuredMovie?.genres)}
        </span>
        <div className='flex items-center gap-1'>
            <CalendarIcon className='w-4.5 h-4.5'/> {featuredMovie?.release_date ? new Date(featuredMovie.release_date).getFullYear() : new Date().getFullYear()}
        </div>
        <div className='flex items-center gap-1'>
            <ClockIcon className='w-4.5 h-4.5'/> {featuredMovie?.runtime ? timeFormat(featuredMovie.runtime) : '2h 10m'}
        </div>
      </div>

      <p className='max-w-xl text-gray-300 line-clamp-3 text-sm md:text-base leading-relaxed'>
        {featuredMovie?.overview || 'Experience the ultimate cinematic adventure. Book your tickets now to get the best seats in the theater.'}
      </p>

      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <button 
          onClick={()=> navigate(featuredMovie ? `/movies/${featuredMovie._id}` : '/movies')} 
          className='flex items-center gap-2 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer shadow-lg'
        >
           Explore Movies
           <ArrowRight className="w-5 h-5"/>
        </button>

        <button 
          onClick={() => setShowTrailerModal(true)} 
          className='flex items-center gap-2 px-6 py-3 text-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition rounded-full font-medium cursor-pointer text-white shadow-lg'
        >
           <PlayIcon className="w-4 h-4 fill-white"/>
           Watch Trailer
        </button>
      </div>

      {/* Trailer Video Player Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
              <h3 className="font-semibold text-white truncate">{featuredMovie?.title || 'Movie Trailer'} - Official Trailer</h3>
              <button 
                onClick={() => setShowTrailerModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <ReactPlayer 
                url={trailerUrl} 
                controls={true} 
                playing={true}
                width="100%" 
                height="100%" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroSection
