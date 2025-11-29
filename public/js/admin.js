document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin JS loaded.');

  // --- Generic Delete Handler for Admin Pages ---
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();

      const entity = this.dataset.entity; // e.g., 'company', 'city'
      const id = this.dataset.id;
      // Handle irregular plurals
      const pluralEntity = entity.endsWith('y') ? entity.slice(0, -1) + 'ies' : entity + 's';
      const url = `/admin/${pluralEntity}/delete/${id}`; // e.g., /admin/companies/delete/1

      if (confirm(`Are you sure you want to delete this ${entity}?`)) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              window.location.reload();
            } else {
              alert(`Error: ${data.message || 'Could not delete the item.'}`);
            }
          })
          .catch(err => console.error('Delete error:', err));
      }
    });
  });

  // --- Generic Toggle Status Handler for Admin Pages ---
  document.querySelectorAll('.btn-toggle').forEach(button => {
    button.addEventListener('click', function () {
      const entity = this.dataset.entity;
      const id = this.dataset.id;
      const pluralEntity = entity.endsWith('y') ? entity.slice(0, -1) + 'ies' : entity + 's';
      const url = `/admin/${pluralEntity}/toggle/${id}`; // e.g., /admin/companies/toggle/1

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            window.location.reload(); // Simple reload for now
          } else {
            alert(`Error: ${data.message || 'Could not update status.'}`);
          }
        })
        .catch(err => console.error('Toggle error:', err));
    });
  });

  // --- Edit Company Modal Handler ---
  const editCompanyModal = document.getElementById('editCompanyModal');
  if (editCompanyModal) {
    editCompanyModal.addEventListener('show.bs.modal', event => {
      // Button that triggered the modal
      const button = event.relatedTarget;
      // Extract company data from the data-company attribute
      const company = JSON.parse(button.dataset.company);

      const modalForm = editCompanyModal.querySelector('form');
      // Set the form's action to the correct endpoint
      modalForm.action = `/admin/companies/edit/${company.id}`;

      // Populate the form fields with the company's data
      modalForm.querySelector('#edit_company_name').value = company.company_name;
      modalForm.querySelector('#edit_contact_person_name').value = company.contact_person_name || '';
      modalForm.querySelector('#edit_contact_phone').value = company.contact_phone || '';
      modalForm.querySelector('#edit_description').value = company.description || '';
      modalForm.querySelector('#edit_email').value = company.email || '';
    });
  }

});