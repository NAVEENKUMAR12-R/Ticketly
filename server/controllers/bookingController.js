import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import { clerkClient } from "@clerk/express";
import stripe from 'stripe'


// Function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats)=>{
    try {
        const showData = await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats || {};

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

export const createBooking = async (req, res)=>{
    let bookedShowId = null;
    let seatsToRelease = [];

    try {
        const {userId} = req.auth();
        const {showId, selectedSeats} = req.body;
        const { origin } = req.headers;

        if (!selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.json({ success: false, message: "Please select at least one seat." });
        }

        // Auto sync user to DB if missing
        try {
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                const clerkUser = await clerkClient.users.getUser(userId);
                if (clerkUser) {
                    await User.create({
                        _id: userId,
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || "User",
                        email: clerkUser.emailAddresses[0]?.emailAddress || "",
                        image: clerkUser.imageUrl || ""
                    });
                }
            }
        } catch (err) {
            console.warn("User auto-sync failed:", err.message);
        }

        // Option A: Atomic double-booking prevention using fine-grained MongoDB query conditions
        const seatCheckConditions = selectedSeats.reduce((acc, seat) => {
            acc[`occupiedSeats.${seat}`] = { $exists: false };
            return acc;
        }, {});

        const seatUpdateSet = selectedSeats.reduce((acc, seat) => {
            acc[`occupiedSeats.${seat}`] = userId;
            return acc;
        }, {});

        // Atomically lock/occupy seats in a single DB operation
        const showData = await Show.findOneAndUpdate(
            { _id: showId, ...seatCheckConditions },
            { $set: seatUpdateSet },
            { new: true }
        ).populate('movie');

        if (!showData) {
            // If atomic update failed, determine which seat(s) caused the conflict to inform the user
            const existingShow = await Show.findById(showId);
            if (!existingShow) {
                return res.json({ success: false, message: "Show not found." });
            }

            const occupied = existingShow.occupiedSeats || {};
            const takenSeats = selectedSeats.filter(seat => occupied[seat]);

            if (takenSeats.length > 0) {
                return res.json({
                    success: false,
                    message: `Seat(s) ${takenSeats.join(', ')} are no longer available. Please select different seats.`
                });
            }

            return res.json({ success: false, message: "Selected seats are no longer available." });
        }

        bookedShowId = showId;
        seatsToRelease = selectedSeats;

        // Create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        });

         // Stripe Gateway Initialize
         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

         // Creating line items for Stripe
         const line_items = [{
            price_data: {
                currency: 'usd',
                product_data:{
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity: 1
         }];

         const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
         });

         booking.paymentLink = session.url;
         await booking.save();

         // Run Inngest Scheduler Function to check payment status after 10 minutes
         await inngest.send({
            name: "app/checkpayment",
            data: {
                bookingId: booking._id.toString()
            }
         });

         res.json({success: true, url: session.url});

    } catch (error) {
        console.log("Error in createBooking:", error.message);

        // Rollback atomic seat lock if booking or Stripe session creation fails
        if (bookedShowId && seatsToRelease.length > 0) {
            try {
                const unsetObj = seatsToRelease.reduce((acc, seat) => {
                    acc[`occupiedSeats.${seat}`] = "";
                    return acc;
                }, {});
                await Show.findByIdAndUpdate(bookedShowId, { $unset: unsetObj });
            } catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr.message);
            }
        }

        res.json({success: false, message: error.message});
    }
}

export const getOccupiedSeats = async (req, res)=>{
    try {
        
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success: true, occupiedSeats})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}