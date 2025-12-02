document.addEventListener('DOMContentLoaded', () => {
  console.log('Partner JS correctly loaded from public/js.');

  const getPlural = (entity) => {
    if (entity === 'bus') return 'buses';
    if (entity === 'schedule') return 'schedules';
    if (entity === 'city') return 'cities';
    return `${entity}s`;
  };

  // --- Generic Delete Handler for Partner Pages ---
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();

      const entity = this.dataset.entity;
      const id = this.dataset.id;
      const pluralEntity = getPlural(entity);
      const url = `/partner/${pluralEntity}/delete/${id}`;

      if (confirm(`Are you sure you want to remove this ${entity}?`)) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              window.location.reload();
            } else {
              alert(`Error: ${data.message || 'Could not remove the item.'}`);
            }
          })
          .catch(err => console.error('Delete error:', err));
      }
    });
  });

  // --- Generic Toggle Status Handler ---
  document.querySelectorAll('.toggle-status').forEach(button => {
    button.addEventListener('click', function () {
      const entity = this.dataset.entity;
      const id = this.dataset.id;
      const pluralEntity = getPlural(entity);
      const url = `/partner/${pluralEntity}/toggle/${id}`;

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            const row = this.closest('tr');
            if (row) {
              const statusBadge = row.querySelector('.status-badge');
              if (statusBadge) {
                if (statusBadge.classList.contains('bg-success')) {
                  statusBadge.classList.replace('bg-success', 'bg-danger');
                  statusBadge.textContent = 'Inactive';
                } else {
                  statusBadge.classList.replace('bg-danger', 'bg-success');
                  statusBadge.textContent = 'Active';
                }
              }
            } else {
              const card = this.closest('.card');
              const badge = card ? card.querySelector('.badge') : null;
              if (badge) {
                if (badge.classList.contains('bg-success')) {
                  badge.classList.replace('bg-success', 'bg-secondary');
                  badge.textContent = 'Inactive';
                } else {
                  badge.classList.replace('bg-secondary', 'bg-success');
                  badge.textContent = 'Active';
                }
              }
            }
          } else {
            alert(`Error: ${data.message || 'Could not update status.'}`);
          }
        })
        .catch(err => console.error('Toggle error:', err));
    });
  });

  // --- Booking Action Handler ---
  document.querySelectorAll('.btn-booking-action').forEach(button => {
    button.addEventListener('click', function () {
      const action = this.dataset.action;
      const id = this.dataset.id;
      const url = `/partner/bookings/${action}/${id}`;

      if (confirm(`Are you sure you want to ${action} this booking?`)) {
        fetch(url, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              location.reload();
            } else {
              alert(`Error: ${data.message || 'Could not perform action.'}`);
            }
          })
          .catch(() => alert('An error occurred.'));
      }
    });
  });

  // --- Edit City Modal Handler ---
  const editCityModal = document.getElementById('editCityModal');
  if (editCityModal) {
    editCityModal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const cityId = button.dataset.cityId;
      const cityName = button.dataset.cityName;

      const modalForm = editCityModal.querySelector('#editCityForm');
      modalForm.action = `/partner/cities/edit/${cityId}`;
      modalForm.querySelector('#edit_city_name').value = cityName;
    });
  }

  // --- Edit Bus Modal Handler ---
  const editBusModal = document.getElementById('editBusModal');
  if (editBusModal) {
    editBusModal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const bus = JSON.parse(button.dataset.bus);

      const modalForm = editBusModal.querySelector('form');
      modalForm.action = `/partner/buses/edit/${bus.id}`;

      modalForm.querySelector('#edit_bus_number').value = bus.bus_number;
      modalForm.querySelector('#edit_bus_type').value = bus.type;
      modalForm.querySelector('#edit_total_seats').value = bus.total_seats;
    });
  }

  // --- Edit Schedule Modal Handler ---
  const editScheduleModal = document.getElementById('editScheduleModal');
  if (editScheduleModal) {
    editScheduleModal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const schedule = JSON.parse(button.dataset.schedule);

      const modalForm = editScheduleModal.querySelector('form');
      modalForm.action = `/partner/schedules/edit/${schedule.id}`;

      modalForm.querySelector('#edit_bus_id').value = schedule.bus_id;
      modalForm.querySelector('#edit_from_city_id').value = schedule.from_city_id;
      modalForm.querySelector('#edit_to_city_id').value = schedule.to_city_id;
      modalForm.querySelector('#edit_travel_date').value = schedule.travel_date.split('T')[0];
      modalForm.querySelector('#edit_departure_time').value = schedule.departure_time.substring(0, 5);
      modalForm.querySelector('#edit_arrival_time').value = schedule.arrival_time.substring(0, 5);
      modalForm.querySelector('#edit_price').value = schedule.price;
    });
  }
});
