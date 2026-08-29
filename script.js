// ========================================================
// 1. DỮ LIỆU NHẬP TAY (Trực tiếp trong code)
// ========================================================
const manualProducts = [
    {
        id: 100,
        name: "Áo khoác dạ nữ dáng ngắn (Nhập tay)",
        category: "áo",
        image: "./image/1.png",
        link: "https://s.shopee.vn/2LXeNQ3rOw"
    },
    {
        id: 99,
        name: "Chân váy xếp li midi (Nhập tay)",
        category: "váy",
        image: "./image/2.png",
        link: "https://s.shopee.vn/2LXeNQ3rOw"
    }
];

// ========================================================
// 2. CẤU HÌNH GOOGLE SHEETS
// ========================================================
const SHEET_ID = "125baWaNJszH0nielm1vWpmIISq3CRXXcmdQySrw6B-0"; 
const SHEET_NAMES = ["Sheet1"];

// ========================================================
// 3. KHAI BÁO BIẾN TOÀN CỤC
// ========================================================
let allProducts = [];       // Lưu toàn bộ dữ liệu gộp
let filteredProducts = [];  // Lưu kết quả sau lọc
let currentCategory = 'all';// Danh mục đang chọn
const PAGE_SIZE = 10;       // Số lượng sản phẩm hiển thị mỗi lần
let visibleCount = PAGE_SIZE;

// ========================================================
// HÀM XỬ LÝ ẢNH CHỐNG BỊ CHẶN BỞI SHOPEE
// ========================================================
function getSafeImageUrl(url) {
    if (!url || url.trim() === '') return 'https://via.placeholder.com/300x400?text=Hình+Ảnh';
    // Giữ nguyên đường dẫn nếu là ảnh lưu nội bộ trong thư mục máy
    if (url.startsWith('./') || url.startsWith('/') || url.startsWith('data:')) return url;
    // Chạy qua máy chủ proxy để hiển thị ảnh Shopee 100% không bị ô trắng
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.trim())}`;
}

// ========================================================
// 4. HÀM CHUẨN HÓA DỮ LIỆU TỪ GOOGLE SHEETS
// ========================================================
function normalizeProduct(item) {
    return {
        id: item.id || item.ID || item.stt || item.STT || '',
        name: item.name || item.Name || item['Tên sản phẩm'] || item['ten'] || 'Sản phẩm',
        category: item.category || item.Category || item['Danh mục'] || item['danhmuc'] || '',
        image: item.image || item.Image || item['Hình ảnh'] || item['anh'] || '',
        link: item.link || item.Link || item.url || '#'
    };
}

// ========================================================
// 5. HÀM TẢI VÀ GỘP DỮ LIỆU TỪ SHEETS & NHẬP TAY
// ========================================================
async function loadProducts() {
    let sheetProducts = [];

    if (SHEET_ID) {
        try {
            const requests = SHEET_NAMES.map(name => 
                fetch(`https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(name)}`)
                    .then(res => res.ok ? res.json() : [])
            );
            
            const results = await Promise.all(requests);
            sheetProducts = results.flat().map(normalizeProduct); 
        } catch (err) {
            console.error("Lỗi lấy dữ liệu từ Google Sheets:", err);
        }
    }

    // Gộp sản phẩm nhập tay + Sản phẩm từ Google Sheet
    allProducts = [...manualProducts, ...sheetProducts];
    filteredProducts = [...allProducts];
    
    renderProducts();
}

// ========================================================
// 6. HÀM HIỂN THỊ SẢN PHẨM & NÚT XEM THÊM
// ========================================================
function renderProducts() {
    const container = document.getElementById('productList');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!container) return;

    container.innerHTML = '';
    
    const itemsToShow = filteredProducts.slice(0, visibleCount);

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align:center; padding: 30px; color: #aaa;">Không tìm thấy sản phẩm phù hợp!</div>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    itemsToShow.forEach((item) => {
        const card = document.createElement('a');
        card.className = 'product-card';
        card.href = item.link || '#';
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        
        // Gọi hàm lấy link ảnh an toàn
        const safeImg = getSafeImageUrl(item.image);

card.innerHTML = `
    <div class="product-img-wrap">
        <img src="${item.image}" referrerpolicy="no-referrer" loading="lazy" alt="${item.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=Hình+Ảnh';">
    </div>
    <div class="product-info-wrap">
        <div class="product-number">${item.id}</div>
        <div class="product-title">${item.name}</div>
    </div>
`;
        container.appendChild(card);
    });

    if (loadMoreBtn) {
        if (visibleCount >= filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

// ========================================================
// 7. CÁC HÀM TƯƠNG TÁC (Tải thêm, Tìm kiếm, Lọc danh mục)
// ========================================================
function loadMore() {
    visibleCount += PAGE_SIZE;
    renderProducts();
}

function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    filteredProducts = allProducts.filter(item => {
        const itemId = item.id ? item.id.toString().toLowerCase() : '';
        const itemName = item.name ? item.name.toLowerCase() : '';
        const itemCat = item.category ? item.category.toLowerCase() : '';

        const matchQuery = itemName.includes(query) || itemId.includes(query);
        const matchCategory = (currentCategory === 'all') || itemCat.includes(currentCategory.toLowerCase());
        
        return matchQuery && matchCategory;
    });

    visibleCount = PAGE_SIZE;
    renderProducts();
}

function filterCategory(cat, event) {
    currentCategory = cat;

    const buttons = document.querySelectorAll('.tag-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    filterProducts();
}

// ========================================================
// 8. KÍCH HOẠT KHI MỞ TRANG
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                alert(`Đã tải ảnh lên: "${file.name}". Đang tìm sản phẩm tương tự...`);
                if (allProducts.length > 0) {
                    filteredProducts = [allProducts[0]];
                    visibleCount = PAGE_SIZE;
                    renderProducts();
                }
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('openCategoryBtn');
    const closeBtn = document.getElementById('closeCategoryBtn');
    const overlay = document.getElementById('categoryOverlay');
    const drawer = document.getElementById('categoryDrawer');
    const catBtns = document.querySelectorAll('.menu-cat-btn');

    function showMenu() {
        if (overlay && drawer) {
            overlay.classList.add('show');
            drawer.classList.add('show');
        }
    }

    function hideMenu() {
        if (overlay && drawer) {
            overlay.classList.remove('show');
            drawer.classList.remove('show');
        }
    }

    if (openBtn) openBtn.addEventListener('click', showMenu);
    if (closeBtn) closeBtn.addEventListener('click', hideMenu);
    if (overlay) overlay.addEventListener('click', hideMenu);

    catBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            catBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const category = this.getAttribute('data-category');
            if (typeof filterProducts === 'function') {
                filterProducts(category);
            }

            hideMenu();
        });
    });
});

// XỬ LÝ TỰ ĐỘNG HIỆN/ẨN NÚT QUAY LẠI ĐẦU TRANG
window.addEventListener('scroll', function() {
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
        // Cuộn xuống quá 100px là hiện nút ngay lập tức
        if (window.scrollY > 100 || document.documentElement.scrollTop > 100) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }
});


// Bấm vào nút sẽ cuộn mượt lên trên cùng
document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('#backToTopBtn')) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});
// Thêm vào bên trong hàm setupEvents() trong script.js
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

if (searchInput && clearSearchBtn) {
    // Hiện/Ẩn nút (X) theo trạng thái ô nhập
    searchInput.addEventListener('input', function() {
        if (this.value.trim().length > 0) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        applyFilter(); // Gọi lại hàm lọc sản phẩm
    });

    // Bấm nút (X) để xóa nhanh toàn bộ nội dung tìm kiếm
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        applyFilter(); // Reset danh sách sản phẩm về ban đầu
    });
}