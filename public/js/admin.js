document.addEventListener('DOMContentLoaded', function () {
  let currentPage = 1;
  let totalPages = 1;
  let inventoryData = [];

  // Load inventory data
  function loadInventory(page = 1) {
    fetch(`/api/inventory?page=${page}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        inventoryData = data.items;
        currentPage = data.currentPage;
        totalPages = data.totalPages;

        console.log('Admin API Response:', data);

        updateAdminTable(inventoryData);
        updateAdminPagination();
      })
      .catch(error => {
        console.error('Admin Fetch Error:', error);
        document.getElementById('adminTableBody').innerHTML =
          `<tr><td colspan="8" class="text-danger">Ошибка загрузки данных: ${error.message}</td></tr>`;
        document.getElementById('adminPagination').innerHTML = '';
      });
  }

  // Update the admin table with inventory data
  function updateAdminTable(items) {
    const tableBody = document.getElementById('adminTableBody');
    tableBody.innerHTML = '';

    items.forEach(item => {
      const currentStatus = item.status || '';
      const isActual = currentStatus === 'Актуально';
      const isNotActual = currentStatus === 'Неактуально';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <select class="form-select form-select-sm" data-field="status" data-id="${item._id}">
            <option value="Актуально" ${isActual ? 'selected' : ''}>
              <span style="color: green;">●</span> Актуально
            </option>
            <option value="Неактуально" ${isNotActual ? 'selected' : ''}>
              <span style="color: red;">●</span> Неактуально
            </option>
          </select>
        </td>
        <td><input type="text" class="form-control form-control-sm" value="${item.inventory_number || ''}" data-field="inventory_number" data-id="${item._id}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.old_inventory_number || ''}" data-field="old_inventory_number" data-id="${item._id}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.description || ''}" data-field="description" data-id="${item._id}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.user || ''}" data-field="user" data-id="${item._id}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.location || ''}" data-field="location" data-id="${item._id}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.responsible_person || ''}" data-field="responsible_person" data-id="${item._id}"></td>
        <td>
          <button class="btn btn-sm btn-success save-btn" data-id="${item._id}">
            Save
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Add event listeners to save buttons
    document.querySelectorAll('.save-btn').forEach(button => {
      button.addEventListener('click', function () {
        saveItem(this.getAttribute('data-id'));
      });
    });
  }

  // Save item changes
  async function saveItem(id) {
    const inputs = document.querySelectorAll(`[data-id="${id}"]`);
    const updateData = {};
    
    inputs.forEach(input => {
      if (input.tagName === 'INPUT' || input.tagName === 'SELECT') {
        updateData[input.getAttribute('data-field')] = input.value;
      }
    });

    try {
      const response = await fetch(`/admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (response.ok) {
        alert('Item updated successfully!');
        loadInventory(currentPage); // Reload current page
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Save Error:', error);
      alert('Error saving item');
    }
  }

  // Update admin pagination controls
  function updateAdminPagination() {
    const pagination = document.getElementById('adminPagination');
    pagination.innerHTML = '';

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) loadInventory(currentPage - 1);
    });
    pagination.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === currentPage ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', (e) => {
        e.preventDefault();
        loadInventory(i);
      });
      pagination.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) loadInventory(currentPage + 1);
    });
    pagination.appendChild(nextLi);
  }

  // Logout functionality
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Logout failed');
      }
    } catch (error) {
      console.error('Logout Error:', error);
      alert('Error during logout');
    }
  });

  // Search functionality for admin panel
  document.getElementById('adminSearchBtn').addEventListener('click', function () {
    const searchTerm = document.getElementById('adminSearchInput').value.trim();

    if (searchTerm) {
      fetch(`/api/inventory/search?term=${searchTerm}`)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(items => {
          updateAdminTable(items);
          document.getElementById('adminPagination').innerHTML = '';
        })
        .catch(error => {
          console.error('Admin Search Error:', error);
          document.getElementById('adminTableBody').innerHTML =
            `<tr><td colspan="8" class="text-danger">Ошибка поиска: ${error.message}</td></tr>`;
        });
    } else {
      loadInventory();
    }
  });

  // Initial load
  loadInventory();
});