import { StarIcon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat'
import { useAppContext } from '../context/AppContext'

const TMDB_GENRES_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

const formatGenres = (genres) => {
  if (!genres || !Array.isArray(genres) || genres.length === 0) return "Action";
  const names = genres.slice(0, 2).map(g => {
    if (typeof g === 'string') return g;
    if (typeof g === 'object' && g?.name) return g.name;
    if (typeof g === 'number' && TMDB_GENRES_MAP[g]) return TMDB_GENRES_MAP[g];
    return null;
  }).filter(Boolean);
  return names.length > 0 ? names.join(" | ") : "Action";
};

const MovieCard = ({movie}) => {

    const navigate = useNavigate()
    const {image_base_url} = useAppContext()

    if (!movie) return null;

    const year = movie.release_date ? (new Date(movie.release_date).getFullYear() || 2025) : 2025;
    const backdrop = movie.backdrop_path 
      ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : (image_base_url || 'https://image.tmdb.org/t/p/w500') + movie.backdrop_path)
      : (movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : (image_base_url || 'https://image.tmdb.org/t/p/w500') + movie.poster_path) : '/backgroundImage.png');

  return (
    <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66'>

      <img onClick={()=> {navigate(`/movies/${movie._id || movie.id}`); scrollTo(0, 0)}}
       src={backdrop} alt={movie.title || 'Movie'} className='rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer'/>

       <p className='font-semibold mt-2 truncate text-white'>{movie.title || 'Untitled Movie'}</p>

       <p className='text-sm text-gray-400 mt-2 truncate'>
        {year} • {formatGenres(movie.genres)} • {timeFormat(movie.runtime)}
       </p>

       <div className='flex items-center justify-between mt-4 pb-3'>
        <button onClick={()=> {navigate(`/movies/${movie._id || movie.id}`); scrollTo(0, 0)}} className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-white'>Buy Tickets</button>

        <p className='flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1'>
            <StarIcon className="w-4 h-4 text-primary fill-primary"/>
            {movie.vote_average ? Number(movie.vote_average).toFixed(1) : '7.0'}
        </p>
       </div>

    </div>
  )
}

export default MovieCard
