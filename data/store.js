// Shared data store for demo
const companies = [
  { id: 1, company_name: 'Selam Bus', contact_person_name: 'Dawit Mekonnen', contact_phone: '+251911123456', email: 'partner@selam.et', password: 'partner123', is_active: true },
  { id: 2, company_name: 'Sky Bus', contact_person_name: 'Sara Ahmed', contact_phone: '+251911234567', email: 'partner@sky.et', password: 'partner123', is_active: true }
];

const cities = [
  { id: 1, name: 'Addis Ababa' },
  { id: 2, name: 'Dire Dawa' },
  { id: 3, name: 'Hawassa' },
  { id: 4, name: 'Bahir Dar' }
];

const buses = [
  { id: 1, bus_company_id: 1, bus_number: 'SB-001', type: 'vip', total_seats: 45, is_active: true },
  { id: 2, bus_company_id: 1, bus_number: 'SB-002', type: 'standard', total_seats: 50, is_active: true },
  { id: 3, bus_company_id: 2, bus_number: 'SK-001', type: 'business', total_seats: 40, is_active: true }
];

const schedules = [
  { id: 1, bus_id: 1, from_city_id: 1, to_city_id: 3, departure_time: '08:00', arrival_time: '12:00', price: 250, available_seats: 40, travel_date: '2024-01-20', is_active: true },
  { id: 2, bus_id: 2, from_city_id: 1, to_city_id: 2, departure_time: '14:00', arrival_time: '18:00', price: 180, available_seats: 45, travel_date: '2024-01-20', is_active: true }
];

module.exports = {
  companies,
  cities,
  buses,
  schedules
};