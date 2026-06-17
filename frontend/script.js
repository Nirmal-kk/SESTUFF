// API Configuration
const API_BASE_URL = window.location.origin.includes("localhost:8080") || window.location.origin.includes("127.0.0.1:8080")
  ? "http://localhost:5000/api"
  : window.location.origin + "/api";

// App State
let state = {
  listings: [],
  bookings: [],
  selectedListing: null
};

// DOM Elements
const listingsGrid = document.getElementById("listings-grid");
const bookingsList = document.getElementById("bookings-list");
const noBookingsPlaceholder = document.getElementById("no-bookings");
const apiStatusBadge = document.getElementById("api-status-badge");
const apiStatusText = document.getElementById("api-status-text");

// Booking Modal Elements
const bookingModal = document.getElementById("booking-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const bookingForm = document.getElementById("booking-form");
const bookingListingIdInput = document.getElementById("booking-listing-id");
const guestNameInput = document.getElementById("guest-name");
const guestEmailInput = document.getElementById("guest-email");
const checkInInput = document.getElementById("check-in-date");
const checkOutInput = document.getElementById("check-out-date");

// Modal Stays Preview
const modalListingImg = document.getElementById("modal-listing-img");
const modalListingTitle = document.getElementById("modal-listing-title");
const modalListingLocation = document.getElementById("modal-listing-location");
const modalListingPrice = document.getElementById("modal-listing-price");

// Modal Pricing Preview
const costNights = document.getElementById("cost-nights");
const costBaseRate = document.getElementById("cost-base-rate");
const costTotal = document.getElementById("cost-total");

// Error Spans
const nameError = document.getElementById("name-error");
const emailError = document.getElementById("email-error");
const checkinError = document.getElementById("checkin-error");
const checkoutError = document.getElementById("checkout-error");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  initDateLimits();
  checkApiHealth();
  fetchListings();
  fetchBookings();
  setupEventListeners();

  // Poll API health every 15 seconds
  setInterval(checkApiHealth, 15000);
});

// Setup Date Limits (Checkin >= today)
function initDateLimits() {
  const today = new Date().toISOString().split("T")[0];
  checkInInput.min = today;
  checkOutInput.min = today;
}

// Check backend server connection
async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      apiStatusBadge.classList.add("connected");
      apiStatusText.textContent = "API Active";
    } else {
      setDisconnectedState();
    }
  } catch (err) {
    setDisconnectedState();
  }
}

function setDisconnectedState() {
  apiStatusBadge.classList.remove("connected");
  apiStatusText.textContent = "Offline";
}

// Fetch Stays Listings from API
async function fetchListings() {
  try {
    const response = await fetch(`${API_BASE_URL}/listings`);
    if (!response.ok) throw new Error("Failed to fetch stays.");
    state.listings = await response.json();
    renderListings();
  } catch (err) {
    console.error(err);
    showToast("Could not retrieve stays. API server might be offline.", "error");
    listingsGrid.innerHTML = `
      <div class="no-bookings-placeholder" style="grid-column: 1/-1;">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--danger)"></i>
        <h3>Error loading stays</h3>
        <p>Ensure the backend service is running and accessible.</p>
      </div>
    `;
  }
}

// Fetch user bookings from API
async function fetchBookings() {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`);
    if (!response.ok) throw new Error("Failed to fetch bookings.");
    state.bookings = await response.json();
    renderBookings();
  } catch (err) {
    console.error(err);
    bookingsList.innerHTML = "";
    noBookingsPlaceholder.classList.remove("hidden");
  }
}

// Render Stay Cards
function renderListings() {
  listingsGrid.innerHTML = "";
  if (state.listings.length === 0) {
    listingsGrid.innerHTML = `<p>No stays available right now.</p>`;
    return;
  }

  state.listings.forEach(listing => {
    const card = document.createElement("div");
    card.className = "listing-card";
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${listing.image}" alt="${listing.title}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'">
        <div class="rating-badge">
          <i class="fa-solid fa-star"></i>
          <span>${listing.rating.toFixed(2)}</span>
        </div>
      </div>
      <div class="card-content">
        <div class="card-title-row">
          <h3>${listing.title}</h3>
          <div class="location-tag">
            <i class="fa-solid fa-location-dot"></i>
            <span>${listing.location}</span>
          </div>
        </div>
        <p class="card-description">${listing.description}</p>
        <div class="card-footer">
          <div class="price-tag">
            <span>Per Night</span>
            <strong>$${listing.price}</strong>
          </div>
          <button class="book-btn" onclick="openBookingModal(${listing.id})">Book Stay</button>
        </div>
      </div>
    `;
    listingsGrid.appendChild(card);
  });
}

// Render active bookings list
function renderBookings() {
  bookingsList.innerHTML = "";
  if (state.bookings.length === 0) {
    noBookingsPlaceholder.classList.remove("hidden");
    return;
  }

  noBookingsPlaceholder.classList.add("hidden");
  state.bookings.forEach(booking => {
    const bookingItem = document.createElement("div");
    bookingItem.className = "booking-item";
    bookingItem.innerHTML = `
      <div class="booking-item-details">
        <h4>${booking.listingTitle}</h4>
        <div class="booking-meta">
          <span><i class="fa-solid fa-calendar"></i> ${booking.checkIn} to ${booking.checkOut}</span>
          <span class="booking-guest"><i class="fa-solid fa-user-tag"></i> ${booking.guestName}</span>
        </div>
      </div>
      <div class="booking-item-right">
        <span class="booking-cost">$${booking.totalCost}</span>
        <button class="cancel-booking-btn" onclick="cancelBooking(${booking.id})">
          <i class="fa-solid fa-trash-can"></i> Cancel
        </button>
      </div>
    `;
    bookingsList.appendChild(bookingItem);
  });
}

// Open Booking Modal for a stay listing
window.openBookingModal = function(listingId) {
  const listing = state.listings.find(l => l.id === listingId);
  if (!listing) return;

  state.selectedListing = listing;
  
  // Fill stays details
  bookingListingIdInput.value = listing.id;
  modalListingImg.src = listing.image;
  modalListingTitle.textContent = listing.title;
  modalListingLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${listing.location}`;
  modalListingPrice.textContent = `$${listing.price}`;

  // Reset form
  bookingForm.reset();
  clearValidationErrors();
  updateCostPreview();

  // Show Modal
  bookingModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent scrolling behind
};

// Close Booking Modal
function closeBookingModal() {
  bookingModal.classList.add("hidden");
  document.body.style.overflow = "auto";
  state.selectedListing = null;
}

// Clear Error Text
function clearValidationErrors() {
  nameError.textContent = "";
  emailError.textContent = "";
  checkinError.textContent = "";
  checkoutError.textContent = "";
}

// Calculate Nights and update cost dynamically
function updateCostPreview() {
  if (!state.selectedListing) return;

  const checkInVal = checkInInput.value;
  const checkOutVal = checkOutInput.value;
  const price = state.selectedListing.price;

  costBaseRate.textContent = `$${price} / night`;

  if (!checkInVal || !checkOutVal) {
    costNights.textContent = "0 nights";
    costTotal.textContent = "$0";
    return;
  }

  const checkIn = new Date(checkInVal);
  const checkOut = new Date(checkOutVal);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (nights > 0) {
    costNights.textContent = `${nights} night${nights > 1 ? "s" : ""}`;
    costTotal.textContent = `$${nights * price}`;
  } else {
    costNights.textContent = "0 nights";
    costTotal.textContent = "$0";
  }
}

// Event Listeners setup
function setupEventListeners() {
  closeModalBtn.addEventListener("click", closeBookingModal);
  
  // Close on backdrop click
  bookingModal.addEventListener("click", (e) => {
    if (e.target === bookingModal) closeBookingModal();
  });

  // Calculate pricing when dates change
  checkInInput.addEventListener("change", () => {
    checkOutInput.min = checkInInput.value;
    updateCostPreview();
  });
  checkOutInput.addEventListener("change", updateCostPreview);

  // Form submission
  bookingForm.addEventListener("submit", handleBookingSubmit);
}

// Form Validations & POST request
async function handleBookingSubmit(e) {
  e.preventDefault();
  clearValidationErrors();

  const listingId = parseInt(bookingListingIdInput.value, 10);
  const guestName = guestNameInput.value.trim();
  const email = guestEmailInput.value.trim();
  const checkIn = checkInInput.value;
  const checkOut = checkOutInput.value;

  let isValid = true;

  // Name Validation
  if (!guestName) {
    nameError.textContent = "Name is required.";
    isValid = false;
  } else if (!/^[a-zA-Z\s]{2,50}$/.test(guestName)) {
    nameError.textContent = "Name must contain only letters and spaces (2-50 characters).";
    isValid = false;
  }

  // Email Validation
  if (!email) {
    emailError.textContent = "Email is required.";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Enter a valid email address.";
    isValid = false;
  }

  // Date validations
  const today = new Date();
  today.setHours(0,0,0,0);
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (!checkIn) {
    checkinError.textContent = "Check-in date is required.";
    isValid = false;
  } else if (checkInDate < today) {
    checkinError.textContent = "Check-in date cannot be in the past.";
    isValid = false;
  }

  if (!checkOut) {
    checkoutError.textContent = "Check-out date is required.";
    isValid = false;
  } else if (checkOutDate <= checkInDate) {
    checkoutError.textContent = "Check-out must be after check-in.";
    isValid = false;
  }

  if (!isValid) return;

  // Dispatch API Call
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId,
        guestName,
        email,
        checkIn,
        checkOut
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to make reservation.");
    }

    showToast("Reservation successfully confirmed!", "success");
    closeBookingModal();
    fetchBookings(); // Reload active bookings
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Cancel Booking (DELETE request)
window.cancelBooking = async function(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to cancel booking.");
    }

    showToast("Booking cancelled successfully.", "success");
    fetchBookings(); // Reload list
  } catch (err) {
    showToast(err.message, "error");
  }
};

// Custom Premium Toast Notification System
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const iconClass = type === "success" 
    ? "fa-solid fa-circle-check" 
    : "fa-solid fa-circle-exclamation";
    
  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);

  // Auto-remove toast after 4.5 seconds
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s reverse forwards";
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4500);
}
