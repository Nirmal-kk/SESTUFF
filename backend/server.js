const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
const path = require("path");
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve frontend index.html on root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


// In-memory stays listing database
const listings = [
  {
    id: 1,
    title: "Aura Glass Dome",
    location: "Lapland, Finland",
    price: 350,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=600&q=80",
    description: "Sleep under the northern lights in a premium heated glass dome with panoramic wilderness views."
  },
  {
    id: 2,
    title: "Velo Vista Chalet",
    location: "Aspen, Colorado",
    price: 480,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=600&q=80",
    description: "Stunning ski-in/ski-out cabin with private outdoor hot tub and gorgeous mountain silhouettes."
  },
  {
    id: 3,
    title: "Meridian Overwater Villa",
    location: "Bora Bora",
    price: 620,
    rating: 4.95,
    image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80",
    description: "Luxurious private bungalow perched over crystalline lagoon waters with transparent floor viewing panels."
  },
  {
    id: 4,
    title: "Cascade Cliffside Loft",
    location: "Santorini, Greece",
    price: 290,
    rating: 4.75,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80",
    description: "Traditional cycladic cave dwelling reimagined into a modern luxury loft with infinity plunge pool."
  }
];

// In-memory bookings store
let bookings = [
  {
    id: 1,
    listingId: 2,
    listingTitle: "Velo Vista Chalet",
    guestName: "Sarah Jenkins",
    email: "sarah@example.com",
    checkIn: "2026-07-10",
    checkOut: "2026-07-15",
    totalCost: 2400
  }
];

// Helper to calculate nights between dates
function getNights(checkInStr, checkOutStr) {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  if (diffTime <= 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// GET all stays listings
app.get("/api/listings", (req, res) => {
  res.json(listings);
});

// GET active bookings
app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

// POST create a booking
app.post("/api/bookings", (req, res) => {
  const { listingId, guestName, email, checkIn, checkOut } = req.body;

  // Input Validations
  if (!listingId || !guestName || !email || !checkIn || !checkOut) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  if (!nameRegex.test(guestName)) {
    return res.status(400).json({ error: "Invalid guest name. Characters and spaces only (2-50)." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  // Find Listing
  const listing = listings.find((l) => l.id === parseInt(listingId, 10));
  if (!listing) {
    return res.status(404).json({ error: "Stay listing not found." });
  }

  // Date validations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
  }

  if (checkInDate < today) {
    return res.status(400).json({ error: "Check-in date cannot be in the past." });
  }

  const nights = getNights(checkIn, checkOut);
  if (nights <= 0) {
    return res.status(400).json({ error: "Check-out date must be after check-in date." });
  }

  // Create booking object
  const nextId = bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;
  const newBooking = {
    id: nextId,
    listingId: listing.id,
    listingTitle: listing.title,
    guestName: guestName.trim(),
    email: email.trim().toLowerCase(),
    checkIn,
    checkOut,
    totalCost: nights * listing.price
  };

  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

// DELETE a booking (Cancel)
app.delete("/api/bookings/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = bookings.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Booking not found." });
  }

  bookings.splice(index, 1);
  res.status(200).json({ message: "Booking cancelled successfully." });
});

// Start server locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`LuxeStay Backend listening on port ${PORT}`);
  });
}

module.exports = app;
