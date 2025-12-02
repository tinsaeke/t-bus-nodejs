document.addEventListener('DOMContentLoaded', function() {
    const scheduleId = document.querySelector('input[name="schedule_id"]').value;
    const seatMapContainer = document.getElementById('seat-map-container');
    const selectedSeatDisplay = document.getElementById('selectedSeatDisplay');
    const selectedSeatInput = document.getElementById('selectedSeatInput');
    const bookBtn = document.getElementById('bookBtn');
    const paymentMethod = document.getElementById('paymentMethod');

    let selectedSeat = null;

    loadSeatMap();

    // Handle payment method change
    paymentMethod.addEventListener('change', function() {
        document.getElementById('telebirrField').classList.remove('active');
        document.getElementById('bankField').classList.remove('active');
        
        if (this.value === 'telebirr') {
            document.getElementById('telebirrField').classList.add('active');
        } else if (this.value === 'cbe_birr') {
            document.getElementById('bankField').classList.add('active');
        }
    });

    async function loadSeatMap() {
        try {
            console.log('Fetching seat map for schedule:', scheduleId);
            const response = await fetch(`/api/seats/${scheduleId}`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Seat map data received:', data);

            if (data.success) {
                renderSeatMap(data);
            } else {
                seatMapContainer.innerHTML = `<p class="text-danger text-center">Error: ${data.message || 'Could not load seat map.'}</p>`;
            }
        } catch (error) {
            console.error('Error loading seat map:', error);
            seatMapContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Error loading seat map:</strong> ${error.message}</div>`;
        }
    }

    function renderSeatMap(data) {
        let html = `
            <div class="bus-container">
                <div class="driver-section">
                    <i class="ri-steering-2-fill fs-4 me-2"></i>
                    <span class="fw-bold">DRIVER'S CABIN</span>
                </div>
        `;

        data.seatLayout.forEach(row => {
            html += `
                <div class="seat-row">
                    <div class="row-label">Row ${row.rowNumber}</div>
                    <div class="seat-group">
            `;
            
            row.seats.filter(seat => seat.position === 'left').forEach(seat => {
                const isBooked = data.bookedSeats.includes(seat.number);
                html += createSeatHTML(seat.number, isBooked);
            });

            html += `</div><div class="aisle">AISLE</div><div class="seat-group">`;

            row.seats.filter(seat => seat.position === 'right').forEach(seat => {
                const isBooked = data.bookedSeats.includes(seat.number);
                html += createSeatHTML(seat.number, isBooked);
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        seatMapContainer.innerHTML = html;

        document.querySelectorAll('.seat.available').forEach(seat => {
            seat.addEventListener('click', function() {
                const seatNumber = this.getAttribute('data-seat');
                selectSeat(this, seatNumber);
            });
        });
    }

    function createSeatHTML(seatNumber, isBooked) {
        const seatClass = isBooked ? 'booked' : 'available';
        return `<div class="seat ${seatClass}" data-seat="${seatNumber}">${seatNumber}</div>`;
    }

    function selectSeat(seatElement, seatNumber) {
        if (selectedSeat) {
            selectedSeat.classList.remove('selected');
            selectedSeat.classList.add('available');
        }

        selectedSeat = seatElement;
        selectedSeat.classList.remove('available');
        selectedSeat.classList.add('selected');

        selectedSeatDisplay.textContent = seatNumber;
        selectedSeatInput.value = seatNumber;
        bookBtn.disabled = false;
    }

    document.getElementById('bookingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!selectedSeatInput.value) {
            alert('Please select a seat first!');
            return;
        }

        const paymentMethodValue = this.payment_method.value;
        
        if (paymentMethodValue === 'telebirr') {
            const telebirrAccount = this.telebirr_account.value.trim();
            if (!telebirrAccount || !/^[0-9]{10,}$/.test(telebirrAccount)) {
                alert('Please enter a valid Telebirr account number!');
                return;
            }
        }
        
        if (paymentMethodValue === 'cbe_birr') {
            const bankAccount = this.bank_account.value.trim();
            if (!bankAccount || !/^[a-zA-Z0-9]{8,}$/.test(bankAccount)) {
                alert('Please enter a valid CBE Birr account number!');
                return;
            }
        }

        const formData = {
            schedule_id: this.schedule_id.value,
            seat_number: this.seat_number.value,
            passenger_name: this.passenger_name.value,
            passenger_phone: this.passenger_phone.value,
            payment_method: paymentMethodValue,
            telebirr_account: this.telebirr_account.value || null,
            bank_account: this.bank_account.value || null
        };

        try {
            bookBtn.disabled = true;
            bookBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Booking...';

            const response = await fetch('/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                window.location.href = `/booking-success?ref=${result.bookingRef}`;
            } else {
                alert(result.message || 'Booking failed. Please try again.');
                bookBtn.disabled = false;
                bookBtn.innerHTML = '<i class="ri-check-double-line me-2"></i> Confirm Booking';
            }
        } catch (error) {
            console.error('Error during booking:', error);
            alert('An error occurred during booking. Please try again later.');
            bookBtn.disabled = false;
            bookBtn.innerHTML = '<i class="ri-check-double-line me-2"></i> Confirm Booking';
        }
    });
});
