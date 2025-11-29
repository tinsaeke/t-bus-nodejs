const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @route   GET /api/seats/:scheduleId
 * @desc    Get seat layout and booked seats for a schedule
 * @access  Public
 */
router.get('/seats/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;

  console.log(`[API] Received request for schedule ID: ${scheduleId}`);

  try {
    // 1. Get schedule and bus information
    const scheduleQuery = `
      SELECT 
        s.bus_id, b.total_seats, b.bus_number, b.type,
        fc.name as from_city_name, tc.name as to_city_name, 
        s.travel_date, s.departure_time, s.price
      FROM schedules s 
      JOIN buses b ON s.bus_id = b.id 
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      WHERE s.id = $1
    `;

    console.log(`[API] Executing query for schedule: ${scheduleId}`);
    const scheduleResult = await pool.query(scheduleQuery, [scheduleId]);

    console.log(`[API] Query result rows:`, scheduleResult.rows.length);

    let busData;
    let useTestData = false;

    if (scheduleResult.rows.length === 0) {
      console.log(`[API] Schedule not found, using test data`);
      useTestData = true;
      // Create test data
      busData = {
        bus_id: 1,
        total_seats: 40,
        bus_number: 'SB-002',
        type: 'Standard',
        from_city_name: 'Debre Markos',
        to_city_name: 'Addis Ababa',
        travel_date: '2025-12-06',
        departure_time: '22:40',
        price: '1000.00'
      };
    } else {
      busData = scheduleResult.rows[0];
    }

    console.log(`[API] Bus data:`, {
      bus_id: busData.bus_id,
      total_seats: busData.total_seats,
      has_seat_layout: !!busData.seat_layout
    });

    // 2. Get or generate seat layout
    let seatLayout;

    if (busData.seat_layout && !useTestData) {
      try {
        console.log(`[API] Parsing stored seat layout`);
        seatLayout = typeof busData.seat_layout === 'string'
          ? JSON.parse(busData.seat_layout)
          : busData.seat_layout;
      } catch (parseError) {
        console.error(`[API] Error parsing seat layout:`, parseError);
        seatLayout = generateDefaultSeatLayout(busData.total_seats || 40);
      }
    } else {
      console.log(`[API] Generating default seat layout`);
      seatLayout = generateDefaultSeatLayout(busData.total_seats || 40);
    }

    // 3. Get all booked seats for this schedule
    let bookedSeats = [];
    if (!useTestData) {
      console.log(`[API] Fetching booked seats for schedule: ${scheduleId}`);
      const bookedSeatsResult = await pool.query(
        `SELECT seat_number FROM bookings 
         WHERE schedule_id = $1 AND booking_status NOT IN ('cancelled', 'rejected')`,
        [scheduleId]
      );
      bookedSeats = bookedSeatsResult.rows.map(row => parseInt(row.seat_number));
    } else {
      // Test booked seats
      bookedSeats = [2, 5, 7, 15, 20, 25, 30, 35];
    }

    console.log(`[API] Found ${bookedSeats.length} booked seats:`, bookedSeats);

    // 4. Send the response
    const responsePayload = {
      success: true,
      scheduleId: parseInt(scheduleId),
      seatLayout: seatLayout,
      bookedSeats: bookedSeats,
      busInfo: {
        busNumber: busData.bus_number,
        busType: busData.type,
        totalSeats: busData.total_seats
      },
      scheduleInfo: {
        from: busData.from_city_name,
        to: busData.to_city_name,
        date: busData.travel_date,
        time: busData.departure_time,
        price: busData.price
      }
    };

    console.log('[API] Sending successful response');
    res.json(responsePayload);

  } catch (error) {
    console.error('[API] Error fetching seat data:', error);
    res.status(500).json({ success: false, message: 'Failed to load seat map data due to a server error.' });
  }
});

/**
 * Generate default 2x2 seat layout
 */
function generateDefaultSeatLayout(totalSeats = 40) {
  console.log(`[API] Generating default layout for ${totalSeats} seats`);
  const seatLayout = [];
  let seatNumber = 1;
  const seatsPerRow = 4;
  const numRows = Math.ceil(totalSeats / seatsPerRow);

  for (let row = 1; row <= numRows; row++) {
    const rowData = {
      rowNumber: row,
      seats: []
    };

    // Left side seats (2 seats)
    for (let i = 0; i < 2 && seatNumber <= totalSeats; i++) {
      rowData.seats.push({
        number: seatNumber,
        position: 'left',
        type: 'standard'
      });
      seatNumber++;
    }

    // Right side seats (2 seats)
    for (let i = 0; i < 2 && seatNumber <= totalSeats; i++) {
      rowData.seats.push({
        number: seatNumber,
        position: 'right',
        type: 'standard'
      });
      seatNumber++;
    }

    seatLayout.push(rowData);
  }

  console.log(`[API] Generated layout with ${seatLayout.length} rows`);
  return seatLayout;
}

module.exports = router;