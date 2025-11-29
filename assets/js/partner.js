document.addEventListener('DOMContentLoaded', () => {
  console.log('Partner JS loaded.');

  const getPlural = (entity) => {
    if (entity === 'bus') return 'buses';
    if (entity === 'schedule') return 'schedules';
    if (entity === 'city') return 'cities';
    return `${entity}s`;
  };

  // --- Generic Delete Handler ---
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function () {
      const entity = this.dataset.entity;
      const id = this.dataset.id;
      const pluralEntity = getPlural(entity);
      const url = `/partner/${pluralEntity}/delete/${id}`;

      if (confirm(`Are you sure you want to delete this ${entity}?`)) {
        fetch(url, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              location.reload();
            } else {
              alert(`Error: ${data.message || 'Could not delete the item.'}`);
            }
          })
          .catch(() => alert('An error occurred.'));
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

      if (confirm(`Are you sure you want to toggle the status of this ${entity}?`)) {
        fetch(url, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              location.reload();
            } else {
              alert(`Error: ${data.message || 'Could not update status.'}`);
            }
          })
          .catch(() => alert('An error occurred.'));
      }
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
      modalForm.querySelector('#edit_travel_date').value = schedule.travel_date;
      modalForm.querySelector('#edit_from_city_id').value = schedule.from_city_id;
      modalForm.querySelector('#edit_to_city_id').value = schedule.to_city_id;
      modalForm.querySelector('#edit_departure_time').value = schedule.departure_time;
      modalForm.querySelector('#edit_arrival_time').value = schedule.arrival_time;
      modalForm.querySelector('#edit_price').value = schedule.price;
    });
  }

  // Helper function to show a simple toast message
  window.showToast = function(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
    toast.className = `toast show align-items-center text-white ${bgColor} border-0`;
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});