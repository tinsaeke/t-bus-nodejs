const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/seats/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;

  try {
    if (!scheduleId || isNaN(scheduleId)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
    }

    const scheduleQuery = `
      SELECT 
        s.id, s.bus_id, b.total_seats, b.bus_number, b.type,
        fc.name as from_city_name, tc.name as to_city_name, 
        s.travel_date, s.departure_time, s.price
      FROM schedules s 
      JOIN buses b ON s.bus_id = b.id 
      JOIN cities fc ON s.from_city_id = fc.id
      JOIN cities tc ON s.to_city_id = tc.id
      WHERE s.id = $1
    `;

    const scheduleResult = await pool.query(scheduleQuery, [scheduleId]);

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const busData = scheduleResult.rows[0];
    const seatLayout = generateDefaultSeatLayout(busData.total_seats || 40);

    const bookedSeatsResult = await pool.query(
      `SELECT seat_number FROM bookings 
       WHERE schedule_id = $1 AND booking_status NOT IN ('cancelled', 'rejected')`,
      [scheduleId]
    );
    const bookedSeats = bookedSeatsResult.rows.map(row => {
      const seatNum = parseInt(row.seat_number);
      return !isNaN(seatNum) ? seatNum : null;
    }).filter(seat => seat !== null);

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

    res.json(responsePayload);

  } catch (error) {
    console.error('Error fetching seat data:', error);
    res.status(500).json({ success: false, message: 'Failed to load seat map. Server error.' });
  }
});

function generateDefaultSeatLayout(totalSeats = 40) {
  const seatLayout = [];
  let seatNumber = 1;
  const seatsPerRow = 4;
  const numRows = Math.ceil(totalSeats / seatsPerRow);

  for (let row = 1; row <= numRows; row++) {
    const rowData = {
      rowNumber: row,
      seats: []
    };

    for (let i = 0; i < 2 && seatNumber <= totalSeats; i++) {
      rowData.seats.push({
        number: seatNumber,
        position: 'left',
        type: 'standard'
      });
      seatNumber++;
    }

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

  return seatLayout;
}

module.exports = router;
