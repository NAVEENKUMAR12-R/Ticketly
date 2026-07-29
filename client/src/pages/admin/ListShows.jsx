import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import { StarIcon, Trash2Icon, VideoIcon, Edit3Icon, CheckIcon, XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ListShows = () => {

    const currency = import.meta.env.VITE_CURRENCY

    const { axios, getToken, user, featuredMovie, fetchFeaturedMovie, fetchShows } = useAppContext()

    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settingHeroId, setSettingHeroId] = useState(null);
    const [deletingShowId, setDeletingShowId] = useState(null);
    
    // State for editing trailer URL inline
    const [editingTrailerMovieId, setEditingTrailerMovieId] = useState(null);
    const [trailerInput, setTrailerInput] = useState("");

    const getAllShows = async () => {
        try {
            const { data } = await axios.get("/api/admin/all-shows", {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setShows((data.shows || []).filter(s => s && s.movie))
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }

    const handleSetHomeBanner = async (movie) => {
        if (!movie?._id) return;
        try {
            setSettingHeroId(movie._id);
            const { data } = await axios.put('/api/admin/set-featured-movie', {
                movieId: String(movie._id),
                movieData: {
                    title: movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    overview: movie.overview,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    runtime: movie.runtime,
                    genres: movie.genres,
                    trailer_url: movie.trailer_url
                }
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success(`"${movie.title}" set as Home Page Banner & Trailer!`);
                if (fetchFeaturedMovie) fetchFeaturedMovie();
                getAllShows();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to set Home Page banner");
        } finally {
            setSettingHeroId(null);
        }
    }

    const handleSaveTrailer = async (movieId) => {
        if (!movieId) return;
        try {
            const { data } = await axios.put('/api/admin/update-trailer', {
                movieId: String(movieId),
                trailer_url: trailerInput
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success(data.message);
                setEditingTrailerMovieId(null);
                setTrailerInput("");
                getAllShows();
                if (fetchFeaturedMovie) fetchFeaturedMovie();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update trailer URL");
        }
    };

    const handleDeleteShow = async (showId, movieTitle) => {
        if (!window.confirm(`Are you sure you want to delete this show for "${movieTitle}"?`)) return;
        try {
            setDeletingShowId(showId);
            const { data } = await axios.delete(`/api/admin/show/${showId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success(data.message);
                getAllShows();
                if (fetchShows) fetchShows();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete show");
        } finally {
            setDeletingShowId(null);
        }
    };

    useEffect(() => {
        if (user) {
            getAllShows();
        }
    }, [user]);

    return !loading ? (
        <>
            <Title text1="List" text2="Shows" />
            <div className="max-w-5xl mt-6 overflow-x-auto">
                {shows.length > 0 ? (
                    <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
                        <thead>
                            <tr className="bg-primary/20 text-left text-white">
                                <th className="p-2.5 font-medium pl-5">Movie Name</th>
                                <th className="p-2.5 font-medium">Show Time</th>
                                <th className="p-2.5 font-medium">Total Bookings</th>
                                <th className="p-2.5 font-medium">Trailer Video URL</th>
                                <th className="p-2.5 font-medium text-center">Home Page Banner</th>
                                <th className="p-2.5 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-light">
                            {shows.map((show, index) => {
                                const movie = show.movie;
                                const isCurrentHero = featuredMovie && movie && String(featuredMovie._id) === String(movie._id);
                                const isEditingTrailer = editingTrailerMovieId === movie?._id;

                                return (
                                    <tr key={index} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10 hover:bg-primary/15 transition">
                                        <td className="p-2.5 min-w-45 pl-5 font-medium text-white flex items-center gap-2">
                                            {movie?.title || 'Unknown Movie'}
                                            {isCurrentHero && (
                                                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 font-normal">
                                                    <StarIcon className="w-3 h-3 fill-amber-400" /> Active Banner
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2.5">{dateFormat(show.showDateTime)}</td>
                                        <td className="p-2.5">{show.occupiedSeats ? Object.keys(show.occupiedSeats).length : 0}</td>
                                        
                                        {/* Trailer URL Column with Inline Edit */}
                                        <td className="p-2.5 max-w-xs">
                                            {isEditingTrailer ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={trailerInput}
                                                        onChange={(e) => setTrailerInput(e.target.value)}
                                                        placeholder="YouTube URL..."
                                                        className="px-2 py-1 bg-gray-900 border border-primary rounded text-xs text-white outline-none w-48"
                                                    />
                                                    <button onClick={() => handleSaveTrailer(movie._id)} className="p-1 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer">
                                                        <CheckIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setEditingTrailerMovieId(null)} className="p-1 bg-gray-700 hover:bg-gray-600 text-white rounded cursor-pointer">
                                                        <XIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                                    <VideoIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                    <span className="truncate max-w-[140px] text-gray-400">
                                                        {movie?.trailer_url ? movie.trailer_url.replace('https://www.youtube.com/watch?v=', 'yt:') : 'Default Trailer'}
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingTrailerMovieId(movie?._id);
                                                            setTrailerInput(movie?.trailer_url || "");
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-white cursor-pointer ml-1"
                                                        title="Edit Trailer URL"
                                                    >
                                                        <Edit3Icon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-2.5 text-center">
                                            {movie?._id ? (
                                                <button
                                                    onClick={() => handleSetHomeBanner(movie)}
                                                    disabled={isCurrentHero || settingHeroId === movie._id}
                                                    className={`px-3 py-1 text-xs rounded-lg transition font-medium cursor-pointer ${
                                                        isCurrentHero
                                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                                                            : 'bg-primary/80 hover:bg-primary text-white'
                                                    } disabled:opacity-70`}
                                                >
                                                    {settingHeroId === movie._id
                                                        ? 'Updating...'
                                                        : isCurrentHero
                                                        ? '★ Active Home Banner'
                                                        : 'Set as Home Banner'}
                                                </button>
                                            ) : (
                                                <span className="text-gray-500 text-xs">N/A</span>
                                            )}
                                        </td>

                                        <td className="p-2.5 text-center">
                                            <button
                                                onClick={() => handleDeleteShow(show._id, movie?.title || 'this show')}
                                                disabled={deletingShowId === show._id}
                                                title="Delete Show"
                                                className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-md transition cursor-pointer disabled:opacity-50"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-400 text-sm mt-4">No shows available. Add shows from the "Add Shows" tab.</p>
                )}
            </div>
        </>
    ) : <Loading />
}

export default ListShows
