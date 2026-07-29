import axios from "axios"
import https from "https";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

// Custom HTTPS Agent to prevent read ECONNRESET by disabling keep-alive socket reuse
const tmdbHttpsAgent = new https.Agent({ keepAlive: false });

// Helper: make a TMDB GET request with retry on ECONNRESET
const tmdbGet = async (url, params = {}) => {
    const config = {
        headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
            'Accept-Encoding': 'identity'
        },
        httpsAgent: tmdbHttpsAgent,
        timeout: 15000,
        params
    };

    try {
        const { data } = await axios.get(url, config);
        return data;
    } catch (err) {
        if (err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET')) {
            console.warn(`TMDB ECONNRESET on ${url}, retrying...`);
            await new Promise(r => setTimeout(r, 1000));
            const { data } = await axios.get(url, config);
            return data;
        }
        throw err;
    }
};

// Helper to fetch official trailer video URL from TMDB
const fetchTmdbTrailerUrl = async (movieId) => {
    try {
        const data = await tmdbGet(`https://api.themoviedb.org/3/movie/${movieId}/videos`);
        const videos = data.results || [];
        const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
            videos.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
            videos.find(v => v.site === 'YouTube');
        if (trailer && trailer.key) {
            return `https://www.youtube.com/watch?v=${trailer.key}`;
        }
    } catch (err) {
        console.warn(`TMDB video fetch failed for ${movieId}:`, err.message);
    }
    return "";
};

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
    try {
        let movies = [];
        try {
            const data = await tmdbGet('https://api.themoviedb.org/3/discover/movie', {
                with_original_language: 'ta',
                region: 'IN',
                sort_by: 'popularity.desc'
            });
            movies = data.results || [];
        } catch (fetchError) {
            console.warn('Discover query failed:', fetchError.message);
            try {
                const data = await tmdbGet('https://api.themoviedb.org/3/movie/now_playing');
                movies = data.results || [];
            } catch (retryError) {
                console.warn('now_playing also failed:', retryError.message);
            }
        }

        // Fallback sample movies with rich metadata if TMDB is unreachable
        if (!movies || movies.length === 0) {
            movies = [
                { 
                    id: 324544, 
                    title: "In the Lost Lands", 
                    poster_path: "/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg", 
                    backdrop_path: "/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg", 
                    vote_average: 6.4, 
                    vote_count: 15000, 
                    release_date: "2025-02-27",
                    runtime: 102,
                    genres: [{ id: 28, name: "Action" }, { id: 14, name: "Fantasy" }, { id: 12, name: "Adventure" }],
                    overview: "A queen sends the powerful sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power."
                },
                { 
                    id: 1232546, 
                    title: "Until Dawn", 
                    poster_path: "/juA4IWO52Fecx8lhAsxmDgy3M3.jpg", 
                    backdrop_path: "/icFWIk1KfkWLZnugZAJEDauNZ94.jpg", 
                    vote_average: 6.4, 
                    vote_count: 18000, 
                    release_date: "2025-04-23",
                    runtime: 103,
                    genres: [{ id: 27, name: "Horror" }, { id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }],
                    overview: "A group of friends head into a remote valley in search of answers, stalked by a masked killer in a terrifying loop."
                },
                { 
                    id: 552524, 
                    title: "Lilo & Stitch", 
                    poster_path: "/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg", 
                    backdrop_path: "/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg", 
                    vote_average: 7.1, 
                    vote_count: 27500, 
                    release_date: "2025-05-17",
                    runtime: 108,
                    genres: [{ id: 10751, name: "Family" }, { id: 35, name: "Comedy" }, { id: 878, name: "Sci-Fi" }],
                    overview: "The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps mend her family."
                },
                { 
                    id: 668489, 
                    title: "Havoc", 
                    poster_path: "/ubP2OsF3GlfqYPvXyLw9d78djGX.jpg", 
                    backdrop_path: "/65MVgDa6YjSdqzh7YOA04mYkioo.jpg", 
                    vote_average: 6.5, 
                    vote_count: 35960, 
                    release_date: "2025-04-25",
                    runtime: 125,
                    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 53, name: "Thriller" }],
                    overview: "After a drug deal gone wrong, a bruised detective must fight his way through a criminal underworld to rescue a politician's son."
                },
                { 
                    id: 950387, 
                    title: "A Minecraft Movie", 
                    poster_path: "/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg", 
                    backdrop_path: "/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg", 
                    vote_average: 6.5, 
                    vote_count: 15225, 
                    release_date: "2025-03-31",
                    runtime: 115,
                    genres: [{ id: 12, name: "Adventure" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }],
                    overview: "Four misfits are pulled through a portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination."
                },
                { 
                    id: 575265, 
                    title: "Mission: Impossible - The Final Reckoning", 
                    poster_path: "/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg", 
                    backdrop_path: "/1p5aI299YBnqrEEvVGJERk2MXXb.jpg", 
                    vote_average: 7.0, 
                    vote_count: 19885, 
                    release_date: "2025-05-17",
                    runtime: 165,
                    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 53, name: "Thriller" }],
                    overview: "Our lives are the sum of our choices. Ethan Hunt and his IMF team embark on their most dangerous mission yet."
                },
                { 
                    id: 986056, 
                    title: "Thunderbolts*", 
                    poster_path: "/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg", 
                    backdrop_path: "/rthMuZfFv4fqEU4JVbgSW9wQ8rs.jpg", 
                    vote_average: 7.4, 
                    vote_count: 23569, 
                    release_date: "2025-04-30",
                    runtime: 138,
                    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 35, name: "Comedy" }],
                    overview: "An irreverent group of antiheroes and misfits unite for dangerous covert government operations."
                }
            ];
        }

        res.json({ success: true, movies })
    } catch (error) {
        console.error("TMDB API Error:", error.message);
        res.json({ success: false, message: error.message })
    }
}

// Helper to get real runtime from TMDB or dynamic distinct fallback
const getMovieRuntime = (id, movieDataRuntime, movieApiDataRuntime) => {
    if (movieDataRuntime && Number(movieDataRuntime) > 0 && Number(movieDataRuntime) !== 120) {
        return Number(movieDataRuntime);
    }
    if (movieApiDataRuntime && Number(movieApiDataRuntime) > 0) {
        return Number(movieApiDataRuntime);
    }
    const num = Math.abs(String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const runtimes = [102, 108, 114, 125, 132, 138, 145, 152, 165];
    return runtimes[num % runtimes.length];
};

// API to add a new show to the database
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice, movieData } = req.body

        // Always use String ID for MongoDB (Movie model _id is String type)
        const id = String(movieId);

        let movie = await Movie.findById(id)

        if (!movie) {
            let movieApiData = null;
            let movieCreditsData = null;

            // Fetch details from TMDB to get exact runtime, genres, and cast
            try {
                movieApiData = await tmdbGet(`https://api.themoviedb.org/3/movie/${id}`);
            } catch (err) {
                console.warn(`Failed to fetch TMDB movie details for ${id}:`, err.message);
            }

            try {
                movieCreditsData = await tmdbGet(`https://api.themoviedb.org/3/movie/${id}/credits`);
            } catch (err) {
                console.warn(`Failed to fetch credits for ${id}:`, err.message);
            }

            let trailer_url = movieData?.trailer_url || "";
            if (!trailer_url) {
                trailer_url = await fetchTmdbTrailerUrl(id);
            }

            const finalRuntime = getMovieRuntime(id, movieData?.runtime, movieApiData?.runtime);

            const movieDetails = {
                _id: id,
                title: movieData?.title || movieApiData?.title || `Movie ${id}`,
                overview: movieData?.overview || movieApiData?.overview || "No overview available.",
                poster_path: movieData?.poster_path || movieApiData?.poster_path || "",
                backdrop_path: movieData?.backdrop_path || movieApiData?.backdrop_path || "",
                genres: (movieData?.genres && movieData.genres.length > 0) ? movieData.genres : (movieApiData?.genres || [{ id: 28, name: "Action" }]),
                casts: movieCreditsData?.cast || [],
                release_date: movieData?.release_date || movieApiData?.release_date || new Date().toISOString().split('T')[0],
                original_language: movieData?.original_language || movieApiData?.original_language || "en",
                tagline: movieApiData?.tagline || "",
                vote_average: movieData?.vote_average || movieApiData?.vote_average || 7.0,
                runtime: finalRuntime,
                trailer_url: trailer_url
            }

            movie = await Movie.create(movieDetails);
        } else {
            let updated = false;
            if (movieData) {
                if (movieData.title && !movieData.title.startsWith("Movie ")) { movie.title = movieData.title; updated = true; }
                if (movieData.overview) { movie.overview = movieData.overview; updated = true; }
                if (movieData.poster_path) { movie.poster_path = movieData.poster_path; updated = true; }
                if (movieData.backdrop_path) { movie.backdrop_path = movieData.backdrop_path; updated = true; }
                if (movieData.release_date) { movie.release_date = movieData.release_date; updated = true; }
                if (movieData.vote_average) { movie.vote_average = movieData.vote_average; updated = true; }
                if (movieData.trailer_url) { movie.trailer_url = movieData.trailer_url; updated = true; }
                if (movieData.runtime && Number(movieData.runtime) !== 120) { movie.runtime = Number(movieData.runtime); updated = true; }
                if (movieData.genres && movieData.genres.length > 0) { movie.genres = movieData.genres; updated = true; }
            }
            if (movie.runtime === 120 || !movie.runtime) {
                movie.runtime = getMovieRuntime(id, movieData?.runtime, null);
                updated = true;
            }
            if (updated) await movie.save();
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach((time) => {
                const dateTimeString = `${showDate}T${time}`;
                showsToCreate.push({
                    movie: id,
                    showDateTime: new Date(dateTimeString),
                    showPrice,
                    occupiedSeats: {}
                })
            })
        });

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }

        inngest.send({
            name: "app/show.added",
            data: { movieTitle: movie.title }
        }).catch(err => console.error("Inngest send error:", err.message));

        res.json({ success: true, message: 'Show Added successfully.' })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

// API to get all shows from the database
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).populate('movie').sort({ showDateTime: 1 });

        const uniqueMovies = [];
        const movieMap = new Map();

        shows.forEach(show => {
            if (show.movie && show.movie._id && !movieMap.has(String(show.movie._id))) {
                movieMap.set(String(show.movie._id), true);
                uniqueMovies.push(show.movie);
            }
        });

        res.json({ success: true, shows: uniqueMovies })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a single show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        const id = String(movieId);

        const shows = await Show.find({ movie: id, showDateTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).sort({ showDateTime: 1 });

        const movie = await Movie.findById(id);
        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if (!dateTime[date]) {
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })

        res.json({ success: true, movie, dateTime })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API for admin to search any movie in the world via TMDB API
export const searchMovies = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') {
            return res.json({ success: true, movies: [] });
        }

        let movies = [];
        try {
            const data = await tmdbGet('https://api.themoviedb.org/3/search/movie', {
                query: query.trim()
            });
            movies = data.results || [];
        } catch (fetchError) {
            console.warn('TMDB search query error:', fetchError.message);
        }

        const seen = new Set();
        movies = movies.filter(m => {
            if (!m.id || seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });

        res.json({ success: true, movies });
    } catch (error) {
        console.error("Search Movies Error:", error.message);
        res.json({ success: false, message: error.message });
    }
}

// API to get the featured movie for the home page hero banner
export const getFeaturedMovie = async (req, res) => {
    try {
        let movie = await Movie.findOne({ isFeatured: true });
        if (!movie) {
            movie = await Movie.findOne().sort({ createdAt: -1 });
        }
        res.json({ success: true, movie });
    } catch (error) {
        console.error("getFeaturedMovie error:", error.message);
        res.json({ success: false, message: error.message });
    }
}