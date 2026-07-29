import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import { deleteMovie, deleteShow, getAllBookings, getAllShows, getDashboardData, isAdmin, setFeaturedMovie, updateMovieTrailer } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)
adminRouter.put('/set-featured-movie', protectAdmin, setFeaturedMovie)
adminRouter.put('/update-trailer', protectAdmin, updateMovieTrailer)
adminRouter.delete('/show/:id', protectAdmin, deleteShow)
adminRouter.delete('/movie/:id', protectAdmin, deleteMovie)

export default adminRouter;