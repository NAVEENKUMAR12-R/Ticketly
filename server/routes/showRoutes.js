import express from "express";
import { addShow, getFeaturedMovie, getNowPlayingMovies, getShow, getShows, searchMovies } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get('/now-playing', protectAdmin, getNowPlayingMovies)
showRouter.get('/search-movies', protectAdmin, searchMovies)
showRouter.post('/add', protectAdmin, addShow)
showRouter.get("/all", getShows)
showRouter.get("/featured-movie", getFeaturedMovie)
showRouter.get("/:movieId", getShow)

export default showRouter;