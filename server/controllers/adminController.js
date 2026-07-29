import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import { clerkClient } from "@clerk/express";

// API to check if user is admin
export const isAdmin = async (req, res) => {
    res.json({ success: true, isAdmin: true })
}

// API to get dashboard data
export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true });
        const activeShows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie');

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser
        }

        res.json({ success: true, dashboardData })
    } catch (error) {
        console.error("getDashboardData error:", error);
        res.json({ success: false, message: error.message })
    }
}

// API to get all shows
export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({}).populate('movie').sort({ showDateTime: -1 });
        const formattedShows = shows.map(s => {
            const showObj = s.toObject();
            if (!showObj.movie) {
                showObj.movie = { _id: s.movie, title: "Movie Deleted", poster_path: "" };
            }
            return showObj;
        });
        res.json({ success: true, shows: formattedShows });
    } catch (error) {
        console.error("getAllShows error:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 });

        const formattedBookings = await Promise.all(bookings.map(async (b) => {
            let bookingObj = b.toObject();

            if (!bookingObj.user || typeof bookingObj.user === 'string') {
                const userIdStr = String(b.user);
                try {
                    const clerkUser = await clerkClient.users.getUser(userIdStr);
                    if (clerkUser) {
                        bookingObj.user = {
                            _id: clerkUser.id,
                            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || "User",
                            email: clerkUser.emailAddresses[0]?.emailAddress || "",
                            image: clerkUser.imageUrl || ""
                        };
                        User.findByIdAndUpdate(
                            clerkUser.id,
                            bookingObj.user,
                            { upsert: true }
                        ).catch(err => console.warn("Auto-sync user error:", err.message));
                    } else {
                        bookingObj.user = { name: "User (" + userIdStr.slice(-6) + ")" };
                    }
                } catch (e) {
                    bookingObj.user = { name: "User (" + userIdStr.slice(-6) + ")" };
                }
            }

            if (!bookingObj.show) {
                bookingObj.show = { movie: { title: "Show Deleted" }, showDateTime: b.createdAt };
            } else if (!bookingObj.show.movie) {
                bookingObj.show.movie = { title: "Movie Deleted" };
            }
            return bookingObj;
        }));

        res.json({ success: true, bookings: formattedBookings });
    } catch (error) {
        console.error("getAllBookings error:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to set a movie as featured on the home page hero banner & custom trailer URL
export const setFeaturedMovie = async (req, res) => {
    try {
        const { movieId, movieData, trailer_url } = req.body;
        if (!movieId) {
            return res.json({ success: false, message: "Movie ID is required" });
        }

        const id = String(movieId);

        await Movie.updateMany({}, { isFeatured: false });

        let movie = await Movie.findById(id);

        const getRuntime = (idStr, val) => {
            if (val && Number(val) > 0 && Number(val) !== 120) return Number(val);
            const num = Math.abs(String(idStr).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
            const runtimes = [102, 108, 114, 125, 132, 138, 145, 152, 165];
            return runtimes[num % runtimes.length];
        };

        if (!movie && movieData) {
            movie = await Movie.create({
                _id: id,
                title: movieData.title || `Movie ${id}`,
                overview: movieData.overview || "No overview available.",
                poster_path: movieData.poster_path || "",
                backdrop_path: movieData.backdrop_path || "",
                release_date: movieData.release_date || new Date().toISOString().split('T')[0],
                original_language: movieData.original_language || "en",
                vote_average: movieData.vote_average || 7.0,
                runtime: getRuntime(id, movieData.runtime),
                genres: movieData.genres || [{ id: 28, name: "Action" }],
                isFeatured: true,
                trailer_url: trailer_url || movieData.trailer_url || ""
            });
        } else if (movie) {
            movie.isFeatured = true;
            if (trailer_url !== undefined && trailer_url.trim() !== "") {
                movie.trailer_url = trailer_url.trim();
            }
            if (movie.runtime === 120 || !movie.runtime) {
                movie.runtime = getRuntime(id, movieData?.runtime);
            }
            if (movieData && movieData.title && !movieData.title.startsWith("Movie ")) {
                movie.title = movieData.title;
                if (movieData.overview) movie.overview = movieData.overview;
                if (movieData.poster_path) movie.poster_path = movieData.poster_path;
                if (movieData.backdrop_path) movie.backdrop_path = movieData.backdrop_path;
                if (movieData.release_date) movie.release_date = movieData.release_date;
                if (movieData.vote_average) movie.vote_average = movieData.vote_average;
                if (movieData.trailer_url) movie.trailer_url = movieData.trailer_url;
                if (movieData.runtime && Number(movieData.runtime) !== 120) movie.runtime = Number(movieData.runtime);
                if (movieData.genres && movieData.genres.length > 0) movie.genres = movieData.genres;
            }
            await movie.save();
        } else {
            return res.json({ success: false, message: "Movie not found in database" });
        }

        res.json({ success: true, message: `"${movie.title}" set as Home Page Banner & Trailer!`, movie });
    } catch (error) {
        console.error("setFeaturedMovie error:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to update movie trailer URL specifically
export const updateMovieTrailer = async (req, res) => {
    try {
        const { movieId, trailer_url } = req.body;
        if (!movieId) {
            return res.json({ success: false, message: "Movie ID is required" });
        }
        const movie = await Movie.findByIdAndUpdate(
            String(movieId), 
            { trailer_url: trailer_url?.trim() || "" }, 
            { new: true }
        );
        if (!movie) {
            return res.json({ success: false, message: "Movie not found" });
        }
        res.json({ success: true, message: `Trailer URL updated for "${movie.title}"!`, movie });
    } catch (error) {
        console.error("updateMovieTrailer error:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete a show
export const deleteShow = async (req, res) => {
    try {
        const { id } = req.params;
        await Show.findByIdAndDelete(id);
        res.json({ success: true, message: "Show deleted successfully" });
    } catch (error) {
        console.error("deleteShow error:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete a movie and all its shows
export const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movieIdStr = String(id);
        await Movie.findByIdAndDelete(movieIdStr);
        await Show.deleteMany({ movie: movieIdStr });
        res.json({ success: true, message: "Movie and associated shows deleted successfully" });
    } catch (error) {
        console.error("deleteMovie error:", error);
        res.json({ success: false, message: error.message });
    }
};