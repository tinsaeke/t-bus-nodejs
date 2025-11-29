document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin JS loaded.');

  // --- Generic Delete Handler ---
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function () {
      const entity = this.dataset.entity; // e.g., 'company', 'city'
      const id = this.dataset.id;
      const url = `/admin/${entity}s/delete/${id}`;

      if (confirm(`Are you sure you want to delete this ${entity}? This action cannot be undone.`)) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Find the table row and remove it
              document.getElementById(`${entity}-${id}`)?.remove();
              showToast(`Successfully deleted ${entity}.`);
            } else {
              alert(`Error: ${data.message || 'Could not delete the item.'}`);
            }
          })
          .catch(err => {
            console.error('Delete error:', err);
            alert('An error occurred. Please check the console.');
          });
      }
    });
  });

  // --- Generic Toggle Status Handler ---
  document.querySelectorAll('.toggle-status').forEach(button => {
    button.addEventListener('click', function () {
      const entity = this.dataset.entity;
      const id = this.dataset.id;
      const url = `/admin/${entity}s/toggle/${id}`;

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Toggle the visual status without reloading
            const statusBadge = document.querySelector(`#${entity}-${id} .status-badge`);
            if (statusBadge) {
              if (statusBadge.classList.contains('bg-success')) {
                statusBadge.classList.replace('bg-success', 'bg-danger');
                statusBadge.textContent = 'Inactive';
              } else {
                statusBadge.classList.replace('bg-danger', 'bg-success');
                statusBadge.textContent = 'Active';
              }
            }
            showToast(`Successfully updated ${entity} status.`);
          } else {
            alert(`Error: ${data.message || 'Could not update status.'}`);
          }
        })
        .catch(err => {
          console.error('Toggle error:', err);
          alert('An error occurred. Please check the console.');
        });
    });
  });

  // --- Edit Company Modal Handler ---
  const editCompanyModal = document.getElementById('editCompanyModal');
  if (editCompanyModal) {
    editCompanyModal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const company = JSON.parse(button.dataset.company);

      const modalForm = editCompanyModal.querySelector('form');
      modalForm.action = `/admin/companies/edit/${company.id}`;

      modalForm.querySelector('#edit_company_name').value = company.company_name;
      modalForm.querySelector('#edit_contact_person_name').value = company.contact_person_name;
      modalForm.querySelector('#edit_contact_phone').value = company.contact_phone;
      modalForm.querySelector('#edit_description').value = company.description;
      modalForm.querySelector('#edit_email').value = company.email; // Assuming you have this field
    });
  }

  // --- Add City to Partner Handler ---
  const addCityForm = document.getElementById('addCityToPartnerForm');
  if (addCityForm) {
    addCityForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const cityId = this.querySelector('#city_id_to_add').value;
      const partnerId = this.dataset.partnerId;
      const url = `/admin/partners/${partnerId}/add-city`;

      if (!cityId) {
        alert('Please select a city from the list.');
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: cityId })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast('City added successfully.');
          window.location.reload(); // Reload to see the new city in the list
        } else {
          alert(`Error: ${data.message || 'Could not add the city.'}`);
        }
      })
      .catch(err => console.error('Error adding city:', err));
    });
  }
});

// Helper function to show a simple toast message
function showToast(message) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast show align-items-center text-white bg-success border-0';
  toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}