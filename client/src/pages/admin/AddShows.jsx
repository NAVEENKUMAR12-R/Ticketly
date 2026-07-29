import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { CheckIcon, DeleteIcon, SearchIcon, StarIcon, ImageIcon } from 'lucide-react';
import { kConverter } from '../../lib/kConverter';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AddShows = () => {

    const { axios, getToken, user, image_base_url, fetchShows, featuredMovie, fetchFeaturedMovie } = useAppContext()

    const currency = import.meta.env.VITE_CURRENCY
    const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [dateTimeSelection, setDateTimeSelection] = useState({});
    const [dateTimeInput, setDateTimeInput] = useState("");
    const [showPrice, setShowPrice] = useState("");
    const [addingShow, setAddingShow] = useState(false);

    // Search state for searching any movie in the world
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [settingBannerId, setSettingBannerId] = useState(null);
    const [customTrailerUrl, setCustomTrailerUrl] = useState("");


    const fetchNowPlayingMovies = async () => {
        try {
            const { data } = await axios.get('/api/show/now-playing', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setNowPlayingMovies(data.movies)
            }
        } catch (error) {
            console.error('Error fetching movies:', error)
        }
    };

    const handleSearch = async (queryText) => {
        const q = queryText !== undefined ? queryText : searchQuery;
        if (!q || q.trim() === '') {
            setSearchResults([]);
            return;
        }
        try {
            setIsSearching(true);
            const { data } = await axios.get(`/api/show/search-movies?query=${encodeURIComponent(q.trim())}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                const seen = new Set();
                const unique = (data.movies || []).filter(m => {
                    if (!m.id || seen.has(m.id)) return false;
                    seen.add(m.id);
                    return true;
                });
                setSearchResults(unique);
                setSelectedMovie(null);
            }
        } catch (err) {
            console.error('Search error:', err);
            toast.error('Failed to search movies');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSetHomeBanner = async (movieObj, e) => {
        if (e) e.stopPropagation();
        const idStr = String(movieObj.id);
        try {
            setSettingBannerId(movieObj.id);

            // First ensure movie entry exists in DB
            const payload = {
                movieId: idStr,
                showsInput: [],
                showPrice: 0,
                movieData: {
                    title: movieObj.title,
                    overview: movieObj.overview || "",
                    poster_path: movieObj.poster_path || "",
                    backdrop_path: movieObj.backdrop_path || "",
                    release_date: movieObj.release_date || "",
                    original_language: movieObj.original_language || "en",
                    vote_average: movieObj.vote_average || 0,
                    runtime: movieObj.runtime || 120,
                    genres: movieObj.genres || (movieObj.genre_ids ? movieObj.genre_ids : [{ id: 28, name: "Action" }]),
                    trailer_url: customTrailerUrl || movieObj.trailer_url || ""
                }
            };
            await axios.post('/api/show/add', payload, { headers: { Authorization: `Bearer ${await getToken()}` } });

            // Set as featured
            const { data } = await axios.put('/api/admin/set-featured-movie', { movieId: idStr }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                toast.success(`"${movieObj.title}" set as Home Page Banner!`);
                if (fetchFeaturedMovie) fetchFeaturedMovie();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to set Home Page Banner");
        } finally {
            setSettingBannerId(null);
        }
    };

    const handleDateTimeAdd = () => {
        if (!dateTimeInput) return;
        const [date, time] = dateTimeInput.split("T");
        if (!date || !time) return;

        setDateTimeSelection((prev) => {
            const times = prev[date] || [];
            if (!times.includes(time)) {
                return { ...prev, [date]: [...times, time] };
            }
            return prev;
        });
    };

    const handleRemoveTime = (date, time) => {
        setDateTimeSelection((prev) => {
            const filteredTimes = prev[date].filter((t) => t !== time);
            if (filteredTimes.length === 0) {
                const { [date]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [date]: filteredTimes,
            };
        });
    };

    const handleSubmit = async () => {
        let currentSelection = { ...dateTimeSelection };

        if (dateTimeInput) {
            const [date, time] = dateTimeInput.split("T");
            if (date && time) {
                const times = currentSelection[date] || [];
                if (!times.includes(time)) {
                    currentSelection = { ...currentSelection, [date]: [...times, time] };
                    setDateTimeSelection(currentSelection);
                }
            }
        }

        if (!selectedMovie) {
            return toast.error('Please select a movie from the list above');
        }
        if (!showPrice) {
            return toast.error('Please enter the show price');
        }
        if (Object.keys(currentSelection).length === 0) {
            return toast.error('Please select a date/time and click "Add Time"');
        }

        try {
            setAddingShow(true)

            const showsInput = Object.entries(currentSelection).map(([date, time]) => ({ date, time }));

            const allMovies = [...searchResults, ...nowPlayingMovies];
            const movieObj = allMovies.find(m => m.id === selectedMovie);

            const payload = {
                movieId: String(selectedMovie),
                showsInput,
                showPrice: Number(showPrice),
                movieData: movieObj ? {
                    title: movieObj.title,
                    overview: movieObj.overview || "",
                    poster_path: movieObj.poster_path || "",
                    backdrop_path: movieObj.backdrop_path || "",
                    release_date: movieObj.release_date || "",
                    original_language: movieObj.original_language || "en",
                    vote_average: movieObj.vote_average || 0,
                    runtime: movieObj.runtime || 120,
                    genres: movieObj.genres || (movieObj.genre_ids ? movieObj.genre_ids : [{ id: 28, name: "Action" }]),
                    trailer_url: customTrailerUrl || movieObj.trailer_url || ""
                } : null
            }

            const { data } = await axios.post('/api/show/add', payload, { headers: { Authorization: `Bearer ${await getToken()}` } })

            if (data.success) {
                toast.success(data.message)
                setSelectedMovie(null)
                setDateTimeSelection({})
                setDateTimeInput("")
                setShowPrice("")
                if (fetchShows) fetchShows()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error('An error occurred. Please try again.')
        } finally {
            setAddingShow(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchNowPlayingMovies();
        }
    }, [user]);

    const displayedMovies = searchResults.length > 0 ? searchResults : nowPlayingMovies;

    return (
        <>
            <Title text1="Add" text2="Shows" />

            {/* Global Movie Search Input */}
            <div className="mt-8 max-w-xl">
                <label className="block text-sm font-medium mb-2 text-gray-300">Search Any Movie in the World</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value) {
                                    setSearchResults([]);
                                    setSelectedMovie(null);
                                }
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Type movie title (e.g. Avatar, Inception, Leo, Pushpa)..."
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg outline-none text-white focus:border-primary text-sm pr-10"
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-3 text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
                        )}
                    </div>
                    <button onClick={() => handleSearch()} disabled={isSearching} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition cursor-pointer disabled:opacity-50">
                        <SearchIcon className="w-4 h-4" />
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            <p className="mt-8 text-lg font-medium">
                {searchResults.length > 0 ? `Search Results for "${searchQuery}" (${searchResults.length})` : 'Now Playing Movies'}
            </p>

            {displayedMovies.length > 0 ? (
                <div className="overflow-x-auto pb-4">
                    <div className="group flex flex-wrap gap-4 mt-4 w-max">
                        {displayedMovies.map((movie) => {
                            const isHero = featuredMovie && String(featuredMovie._id) === String(movie.id);
                            return (
                                <div key={movie.id} className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 `} onClick={() => setSelectedMovie(movie.id)}>
                                    <div className="relative rounded-lg overflow-hidden h-56 w-40 bg-gray-800">
                                        {movie.poster_path ? (
                                            <img src={movie.poster_path.startsWith('http') ? movie.poster_path : (image_base_url || 'https://image.tmdb.org/t/p/w500') + movie.poster_path} alt={movie.title} className="w-full h-full object-cover brightness-90" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-gray-400">No Image</div>
                                        )}
                                        <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                                            <p className="flex items-center gap-1 text-gray-400">
                                                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                                                {movie.vote_average ? movie.vote_average.toFixed(1) : '7.0'}
                                            </p>
                                            <p className="text-gray-300">{movie.vote_count ? kConverter(movie.vote_count) : '0'} Votes</p>
                                        </div>
                                    </div>
                                    {selectedMovie === movie.id && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded z-10 shadow">
                                            <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                        </div>
                                    )}

                                    {/* Home Banner Toggle Badge */}
                                    <button
                                        onClick={(e) => handleSetHomeBanner(movie, e)}
                                        disabled={isHero || settingBannerId === movie.id}
                                        title="Set as Home Page Banner"
                                        className={`mt-1.5 w-full py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                                            isHero
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                                                : 'bg-gray-800 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-gray-700'
                                        }`}
                                    >
                                        <StarIcon className={`w-3 h-3 ${isHero ? 'fill-amber-400 text-amber-400' : ''}`} />
                                        {settingBannerId === movie.id ? 'Setting...' : isHero ? 'Active Home Banner' : 'Set as Home Banner'}
                                    </button>

                                    <p className="font-medium truncate mt-1">{movie.title}</p>
                                    <p className="text-gray-400 text-sm">{movie.release_date || 'N/A'}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="mt-4 text-gray-400 text-sm">
                    {isSearching ? 'Searching TMDB database...' : 'No movies found. Try searching for a movie title above.'}
                </div>
            )}

            {/* Show Price Input */}
            <div className="mt-8 flex flex-wrap gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Show Price</label>
                    <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md bg-gray-900">
                        <p className="text-gray-400 text-sm">{currency}</p>
                        <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Enter show price" className="outline-none bg-transparent text-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Trailer YouTube URL (Optional)</label>
                    <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md bg-gray-900 min-w-80">
                        <input type="text" value={customTrailerUrl} onChange={(e) => setCustomTrailerUrl(e.target.value)} placeholder="e.g. https://www.youtube.com/watch?v=..." className="outline-none bg-transparent text-white w-full text-sm" />
                    </div>
                </div>
            </div>

            {/* Date & Time Selection */}
            <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Select Date and Time</label>
                <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
                    <input type="datetime-local" value={dateTimeInput} onChange={(e) => setDateTimeInput(e.target.value)} className="outline-none rounded-md" />
                    <button onClick={handleDateTimeAdd} className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer" >
                        Add Time
                    </button>
                </div>
            </div>

            {/* Display Selected Times */}
            {Object.keys(dateTimeSelection).length > 0 && (
                <div className="mt-6">
                    <h2 className=" mb-2">Selected Date-Time</h2>
                    <ul className="space-y-3">
                        {Object.entries(dateTimeSelection).map(([date, times]) => (
                            <li key={date}>
                                <div className="font-medium">{date}</div>
                                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                                    {times.map((time) => (
                                        <div key={time} className="border border-primary px-2 py-1 flex items-center rounded" >
                                            <span>{time}</span>
                                            <DeleteIcon onClick={() => handleRemoveTime(date, time)} width={15} className="ml-2 text-red-500 hover:text-red-700 cursor-pointer" />
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <button onClick={handleSubmit} disabled={addingShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" >
                {addingShow ? 'Adding Show...' : 'Add Show'}
            </button>
        </>
    )
}

export default AddShows
