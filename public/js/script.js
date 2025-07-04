document.addEventListener('DOMContentLoaded', function () {
    let currentPage = 1;
    let totalPages = 1;
    let inventoryData = [];
  
    // Initialize FlexSearch
    const index = new FlexSearch.Document({
      document: {
        id: "id",
        index: ["inventory_number", "old_inventory_number", "description"]
      }
    });
  
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
  
          console.log('API Response:', data); // Debug line
  
          updateTable(inventoryData);
          updatePagination();
          index.add(data.items);
        })
        .catch(error => {
          console.error('Fetch Error:', error);
          document.getElementById('inventoryTableBody').innerHTML =
            `<tr><td colspan="8" class="text-danger">Ошибка загрузки данных: ${error.message}</td></tr>`;
          document.getElementById('pagination').innerHTML = '';
        });
    }
  
    // Update the table with inventory data
    function updateTable(items) {
      const tableBody = document.getElementById('inventoryTableBody');
      tableBody.innerHTML = '';
  
      items.forEach(item => {
        const row = document.createElement('tr');
  
        // Add colored indicator for status
        let statusDisplay = item.status;
        if (item.status === 'Актуально') {
          statusDisplay = '<span style="display:inline-flex;align-items:center;"><span style="color: green; font-weight: bold; font-size:1.2em; margin-right: 0.4em;">●</span>Актуально</span>';
        } else if (item.status === 'Неактуально') {
          statusDisplay = '<span style="display:inline-flex;align-items:center;"><span style="color: red; font-weight: bold; font-size:1.2em; margin-right: 0.4em;">●</span>Неактуально</span>';
        }
  
        row.innerHTML = `
          <td style="padding-right: 2em;">${statusDisplay}</td>
          <td>${item.inventory_number}</td>
          <td>${item.old_inventory_number}</td>
          <td>${item.description}</td>
          <td>${item.user}</td>
          <td>${item.location}</td>
          <td>${item.responsible_person}</td>
          <td>
            <button class="btn btn-sm btn-outline-success action-btn" data-id="${item._id}">
              View Details
            </button>
          </td>
        `;
  
        tableBody.appendChild(row);
      });
  
      // Add event listeners to the buttons
      document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function () {
          showDetails(this.getAttribute('data-id'));
        });
      });
    }
  
    // Update pagination controls
    function updatePagination() {
      const pagination = document.getElementById('pagination');
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
  
    // Show details in modal
    function showDetails(id) {
      fetch(`/api/inventory/${id}`)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(item => {
          const modalBody = document.getElementById('modalBody');
          modalBody.innerHTML = `
            <dl>
              <dt>Статус:</dt><dd>${item.status}</dd>
              <dt>Инвентарный номер:</dt><dd>${item.inventory_number}</dd>
              <dt>Старый инвентарный номер:</dt><dd>${item.old_inventory_number}</dd>
              <dt>Описание:</dt><dd>${item.description}</dd>
              <dt>Количество:</dt><dd>${item.quantity}</dd>
              <dt>Дата приобретения:</dt><dd>${item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : ''}</dd>
              <dt>Дата ввода в эксплуатацию:</dt><dd>${item.commissioning_date ? new Date(item.commissioning_date).toLocaleDateString() : ''}</dd>
              <dt>(%)срок службы:</dt><dd>${item.depreciation_rate}</dd>
              <dt>Дата окончания эксплуатации:</dt><dd>${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : ''}</dd>
              <dt>Остаток:</dt><dd>${item.remainder !== undefined ? item.remainder : ''}</dd>
              <dt>Первоначальная стоимость:</dt><dd>${item.initial_cost != null ? item.initial_cost.toLocaleString() : ''}</dd>
              <dt>Накопл. амортизация:</dt><dd>${item.accumulated_depreciation != null ? item.accumulated_depreciation.toLocaleString() : ''}</dd>
              <dt>Годовая амортизация:</dt><dd>${item.annual_depreciation != null ? item.annual_depreciation.toLocaleString() : ''}</dd>
              <dt>Месячная амортизация:</dt><dd>${item.monthly_depreciation != null ? item.monthly_depreciation.toLocaleString() : ''}</dd>
              <dt>Ликвидационная стоимость:</dt><dd>${item.residual_value != null ? item.residual_value.toLocaleString() : ''}</dd> 
              <dt>МОЛ:</dt><dd>${item.responsible_person}</dd>
              <dt>Тип:</dt><dd>${item.type}</dd>
              <dt>Бренд:</dt><dd>${item.brand}</dd>
              <dt>Пользователь:</dt><dd>${item.user}</dd>
              <dt>Локация:</dt><dd>${item.location}</dd>
              <dt>Модель:</dt><dd>${item.model}</dd>
              <dt>Серийный номер:</dt><dd>${item.serial_number}</dd>
              <dt>Департамент:</dt><dd>${item.department}</dd>
            </dl>
          `;
          const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
          modal.show();
        })
        .catch(error => {
          console.error('Error loading item details:', error);
          alert(`Не удалось загрузить детали элемента: ${error.message}`);
        });
    }
  
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', function () {
      const searchTerm = document.getElementById('searchInput').value.trim();
  
      if (searchTerm) {
        fetch(`/api/inventory/search?term=${searchTerm}`)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
          })
          .then(items => {
            updateTable(items);
            // Show a disabled pagination bar indicating search results
            document.getElementById('pagination').innerHTML = '<li class="page-item disabled"><span class="page-link">Результаты поиска</span></li>';
          })
          .catch(error => {
            console.error('Search Error:', error);
            document.getElementById('inventoryTableBody').innerHTML =
              `<tr><td colspan="8" class="text-danger">Ошибка поиска: ${error.message}</td></tr>`;
            document.getElementById('pagination').innerHTML = '<li class="page-item disabled"><span class="page-link">Результаты поиска</span></li>';
          });
      } else {
        loadInventory();
      }
    });
  
    // Initial load
    loadInventory();
  });
  