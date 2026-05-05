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

    // Get current filter values
    function getFilters() {
      return {
        status: document.getElementById('filterStatus').value,
        department: document.getElementById('filterDepartment').value,
        type: document.getElementById('filterType').value
      };
    }

    // Build query string from filters
    function buildFilterQuery(page) {
      const filters = getFilters();
      const params = new URLSearchParams();
      params.set('page', page);
      if (filters.status) params.set('status', filters.status);
      if (filters.department) params.set('department', filters.department);
      if (filters.type) params.set('type', filters.type);
      return params.toString();
    }

    // Load filter options from API
    function loadFilters() {
      fetch('/api/inventory/filters')
        .then(res => res.json())
        .then(data => {
          fillSelect('filterStatus', data.statuses, 'Все статусы');
          fillSelect('filterDepartment', data.departments, 'Все отделы');
          fillSelect('filterType', data.types, 'Все типы');
        })
        .catch(err => console.error('Error loading filters:', err));
    }

    function fillSelect(id, options, defaultLabel) {
      const select = document.getElementById(id);
      const currentValue = select.value;
      select.innerHTML = `<option value="">${defaultLabel}</option>`;
      options.forEach(opt => {
        select.innerHTML += `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`;
      });
    }

    // Filter change handlers
    document.getElementById('filterStatus').addEventListener('change', () => loadInventory(1));
    document.getElementById('filterDepartment').addEventListener('change', () => loadInventory(1));
    document.getElementById('filterType').addEventListener('change', () => loadInventory(1));
    document.getElementById('resetFilters').addEventListener('click', () => {
      document.getElementById('filterStatus').value = '';
      document.getElementById('filterDepartment').value = '';
      document.getElementById('filterType').value = '';
      document.getElementById('searchInput').value = '';
      loadInventory(1);
    });
  
    // Load inventory data
    function loadInventory(page = 1) {
      fetch(`/api/inventory?${buildFilterQuery(page)}`)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          inventoryData = data.items;
          currentPage = data.currentPage;
          totalPages = data.totalPages;
  
          console.log('API Response:', data);
  
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
          // ── Fill asset details ──
          const modalBody = document.getElementById('modalBody');
          modalBody.innerHTML = `
            <div class="row g-4 mb-3">
              <!-- Основное -->
              <div class="col-md-6">
                <div class="card h-100 border shadow-sm" style="border-radius: 10px; overflow: hidden;">
                  <div class="card-header bg-white py-3 border-bottom">
                    <h6 class="mb-0 fw-bold text-dark"><i class="bi bi-info-circle text-primary me-2"></i>Основная информация</h6>
                  </div>
                  <div class="card-body bg-white">
                    <ul class="list-group list-group-flush" style="background: transparent;">
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Тип</span>
                        <span class="fw-medium text-end">${item.type || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Бренд</span>
                        <span class="fw-medium text-end">${item.brand || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Модель</span>
                        <span class="fw-medium text-end">${item.model || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Серийный номер</span>
                        <span class="fw-medium text-end">${item.serial_number || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Описание</span>
                        <span class="fw-medium text-end text-break" style="max-width:60%;">${item.description || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-0">
                        <span class="text-muted small">Количество</span>
                        <span class="fw-medium text-end">${item.quantity ?? '—'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Размещение и статус -->
              <div class="col-md-6">
                <div class="card h-100 border shadow-sm" style="border-radius: 10px; overflow: hidden;">
                  <div class="card-header bg-white py-3 border-bottom">
                    <h6 class="mb-0 fw-bold text-dark"><i class="bi bi-geo-alt text-success me-2"></i>Размещение и статус</h6>
                  </div>
                  <div class="card-body bg-white">
                    <ul class="list-group list-group-flush" style="background: transparent;">
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Статус</span>
                        <span class="badge bg-secondary px-2 py-1 rounded-pill">${item.status || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Инвентарный номер</span>
                        <span class="fw-bold font-monospace bg-light px-2 py-1 rounded border">${item.inventory_number || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Департамент</span>
                        <span class="fw-medium text-end">${item.department || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Локация</span>
                        <span class="fw-medium text-end">${item.location || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Пользователь</span>
                        <span class="fw-medium text-end">${item.user || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-0">
                        <span class="text-muted small">МОЛ</span>
                        <span class="fw-medium text-end">${item.responsible_person || '—'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Финансы -->
              <div class="col-md-6">
                <div class="card h-100 border shadow-sm" style="border-radius: 10px; overflow: hidden;">
                  <div class="card-header bg-white py-3 border-bottom">
                    <h6 class="mb-0 fw-bold text-dark"><i class="bi bi-cash-coin text-warning me-2"></i>Финансы</h6>
                  </div>
                  <div class="card-body bg-white">
                    <ul class="list-group list-group-flush" style="background: transparent;">
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Первоначальная стоимость</span>
                        <span class="fw-medium text-end">${item.initial_cost != null ? item.initial_cost.toLocaleString('ru') + ' ₸' : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Ликвидационная стоимость</span>
                        <span class="fw-medium text-end">${item.residual_value != null ? item.residual_value.toLocaleString('ru') + ' ₸' : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Накопл. амортизация</span>
                        <span class="fw-medium text-end">${item.accumulated_depreciation != null ? item.accumulated_depreciation.toLocaleString('ru') + ' ₸' : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Годовая амортизация</span>
                        <span class="fw-medium text-end">${item.annual_depreciation != null ? item.annual_depreciation.toLocaleString('ru') + ' ₸' : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Месячная амортизация</span>
                        <span class="fw-medium text-end">${item.monthly_depreciation != null ? item.monthly_depreciation.toLocaleString('ru') + ' ₸' : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Срок службы (%)</span>
                        <span class="fw-medium text-end">${item.depreciation_rate ?? '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-0">
                        <span class="text-muted small">Остаток</span>
                        <span class="fw-medium text-end">${item.remainder ?? '—'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Даты и номера -->
              <div class="col-md-6">
                <div class="card h-100 border shadow-sm" style="border-radius: 10px; overflow: hidden;">
                  <div class="card-header bg-white py-3 border-bottom">
                    <h6 class="mb-0 fw-bold text-dark"><i class="bi bi-calendar3 text-info me-2"></i>Даты и номера</h6>
                  </div>
                  <div class="card-body bg-white">
                    <ul class="list-group list-group-flush" style="background: transparent;">
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Старый инв. номер</span>
                        <span class="fw-medium text-end">${item.old_inventory_number || '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Дата приобретения</span>
                        <span class="fw-medium text-end">${item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('ru') : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-bottom-dashed">
                        <span class="text-muted small">Ввод в эксплуатацию</span>
                        <span class="fw-medium text-end">${item.commissioning_date ? new Date(item.commissioning_date).toLocaleDateString('ru') : '—'}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent border-0">
                        <span class="text-muted small">Дата окончания</span>
                        <span class="fw-medium text-end">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('ru') : '—'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <style>
              .border-bottom-dashed { border-bottom: 1px dashed #dee2e6 !important; }
            </style>
          `;

          // ── Generate QR code ──
          const assetUrl = `${window.location.protocol}//${window.location.host}/asset/${item._id}`;
          const qrContainer = document.getElementById('qrContainer');
          qrContainer.innerHTML = ''; // clear previous QR
          const qrObj = new QRCode(qrContainer, {
            text: assetUrl,
            width: 180,
            height: 180,
            colorDark: '#1e1e2e',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });

          // Show inventory number below QR
          document.getElementById('qrInvNumber').textContent =
            item.inventory_number ? `Инв. № ${item.inventory_number}` : item._id;

          // ── Wire up print button ──
          const printBtn = document.getElementById('printQrBtn');
          // Remove any old listener by cloning
          const newPrintBtn = printBtn.cloneNode(true);
          printBtn.parentNode.replaceChild(newPrintBtn, printBtn);

          newPrintBtn.addEventListener('click', function () {
            // qrcodejs generates a canvas inside the container — grab it
            const qrCanvas = qrContainer.querySelector('canvas');
            const printArea = document.getElementById('qrPrintArea');
            const invNum = item.inventory_number || item._id;
            const desc = item.description ? item.description.slice(0, 50) : '';

            if (qrCanvas) {
              const dataUrl = qrCanvas.toDataURL('image/png');
              printArea.innerHTML = `
                <div style="
                  display: flex; flex-direction: column; align-items: center; gap: 8px;
                  padding: 16px; border: 2px solid #333; border-radius: 10px;
                  width: 230px; font-family: 'Segoe UI', sans-serif;
                  background: #fff;
                ">
                  <div style="font-size:10px;color:#555;font-weight:700;letter-spacing:2px;text-transform:uppercase;">InventoryDB</div>
                  <img src="${dataUrl}" width="190" height="190" style="display:block;" />
                  <div style="font-size:13px;font-weight:700;color:#1e1e2e;text-align:center;">${invNum}</div>
                  ${desc ? `<div style="font-size:10px;color:#555;text-align:center;line-height:1.3;">${desc}</div>` : ''}
                </div>
              `;
            } else {
              printArea.innerHTML = '<p>Ошибка: QR-код ещё не готов. Подождите момент.</p>';
            }
            printArea.style.display = 'block';
            window.print();
            printArea.style.display = 'none';
          });

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
    loadFilters();
    loadInventory();
  });