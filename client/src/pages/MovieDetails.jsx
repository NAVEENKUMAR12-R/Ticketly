import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlurCircle from '../components/BlurCircle'
import { Heart, PlayCircleIcon, StarIcon, XIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import DateSelect from '../components/DateSelect'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ReactPlayer from 'react-player'

const TMDB_GENRES_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

const MovieDetails = () => {

  const navigate = useNavigate()
  const {id} = useParams()
  const [show, setShow] = useState(null)
  const [showTrailerModal, setShowTrailerModal] = useState(false)

  const {shows, axios, getToken, user, fetchFavoriteMovies, favoriteMovies, image_base_url} = useAppContext()

  const getShow = async ()=>{
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if(data.success){
        setShow(data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleFavorite = async ()=>{
    try {
      if(!user) return toast.error("Please login to proceed");

      const { data } = await axios.post('/api/user/update-favorite', {movieId: id}, {headers: { Authorization: `Bearer ${await getToken()}` }})

      if(data.success){
        await fetchFavoriteMovies()
        toast.success(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  useEffect(()=>{
    getShow()
  },[id])

  const formatGenres = (genres) => {
    if (!genres || genres.length === 0) return "Action";
    return genres.map(g => {
        if (typeof g === 'string') return g;
        if (typeof g === 'object' && g.name) return g.name;
        if (typeof g === 'number' && TMDB_GENRES_MAP[g]) return TMDB_GENRES_MAP[g];
        return null;
    }).filter(Boolean).join(", ") || "Action";
  };

  const trailerUrl = show?.movie?.trailer_url || 'https://www.youtube.com/watch?v=WpW36ldAqnM'

  return show ? (
    <div className='px-6 md:px-16 lg:px-40 pt-30 md:pt-50'>
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>

        <img src={show.movie.poster_path ? (show.movie.poster_path.startsWith('http') ? show.movie.poster_path : image_base_url + show.movie.poster_path) : '/backgroundImage.png'} alt={show.movie.title} className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover'/>

        <div className='relative flex flex-col gap-3'>
          <BlurCircle top="-100px" left="-100px"/>
          <p className='text-primary uppercase tracking-wider text-xs font-semibold'>{show.movie.original_language || 'ENGLISH'}</p>
          <h1 className='text-4xl font-semibold max-w-96 text-balance'>{show.movie.title}</h1>
          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className="w-5 h-5 text-primary fill-primary"/>
            {show.movie.vote_average ? show.movie.vote_average.toFixed(1) : '7.0'} User Rating
          </div>

          <p className='text-gray-400 mt-2 text-sm leading-relaxed max-w-xl'>{show.movie.overview}</p>

          <p className="text-gray-300 text-sm">
            {timeFormat(show.movie.runtime || 120)} • {formatGenres(show.movie.genres)} • {show.movie.release_date ? show.movie.release_date.split("-")[0] : '2025'}
          </p>

          <div className='flex items-center flex-wrap gap-4 mt-4'>
            <button 
              onClick={() => setShowTrailerModal(true)} 
              className='flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-700 transition rounded-md font-medium cursor-pointer active:scale-95 text-white'
            >
              <PlayCircleIcon className="w-5 h-5 text-primary"/>
              Watch Trailer
            </button>
            <a href="#dateSelect" className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95'>Buy Tickets</a>
            <button onClick={handleFavorite} className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95'>
              <Heart className={`w-5 h-5 ${favoriteMovies.find(movie => String(movie._id) === String(id)) ? 'fill-primary text-primary' : ""} `}/>
            </button>
          </div>
        </div>
      </div>

      {/* Trailer Video Player Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
              <h3 className="font-semibold text-white truncate">{show.movie.title} - Official Trailer</h3>
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

      {show.movie.casts && show.movie.casts.length > 0 && (
        <>
          <p className='text-lg font-medium mt-20'>Your Favorite Cast</p>
          <div className='overflow-x-auto no-scrollbar mt-8 pb-4'>
            <div className='flex items-center gap-4 w-max px-4'>
              {show.movie.casts.slice(0,12).map((cast,index)=> (
                <div key={index} className='flex flex-col items-center text-center'>
                  <img src={cast.profile_path ? (cast.profile_path.startsWith('http') ? cast.profile_path : image_base_url + cast.profile_path) : '/backgroundImage.png'} alt="" className='rounded-full h-20 md:h-20 aspect-square object-cover'/>
                  <p className='font-medium text-xs mt-3'>{cast.name}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <DateSelect dateTime={show.dateTime} id={id}/>

      <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
          {shows.slice(0,4).map((movie, index)=> (
            <MovieCard key={index} movie={movie}/>
          ))}
      </div>
      <div className='flex justify-center mt-20'>
          <button onClick={()=> {navigate('/movies'); scrollTo(0,0)}} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'>Show more</button>
      </div>

    </div>
  ) : <Loading />
}

export default MovieDetails
