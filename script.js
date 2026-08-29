// ========================================================
// MỤC 1: CẤU HÌNH BAN ĐẦU & DỮ LIỆU NHẬP TAY
// ========================================================
// const manualProducts = [
//     {
//         id: 100,
//         name: "Áo khoác dạ nữ dáng ngắn (Nhập tay)",
//         category: "Áo khoác",
//         image: "./image/1.png",
//         link: "https://s.shopee.vn/2LXeNQ3rOw"
//     },
//     {
//         id: 99,
//         name: "Chân váy xếp li midi (Nhập tay)",
//         category: "Váy / Set",
//         image: "./image/2.png",
//         link: "https://s.shopee.vn/2LXeNQ3rOw"
//     }
// ];
// BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ TRÁNH LỖI (Khai báo mảng rỗng):
const manualProducts = [];

// Cấu hình kết nối Google Sheets
const SHEET_ID = "125baWaNJszH0nielm1vWpmIISq3CRXXcmdQySrw6B-0"; 
const SHEET_NAMES = ["Sheet1"];


// ========================================================
// MỤC 2: KHAI BÁO BIẾN TOÀN CỤC (GLOBAL VARIABLES)
// ========================================================
let allProducts = [];       // Lưu toàn bộ dữ liệu gộp
let filteredProducts = [];  // Lưu kết quả sau lọc
let currentCategory = 'all';// Danh mục đang chọn
const PAGE_SIZE = 10;       // Số lượng sản phẩm hiển thị mỗi trang
let visibleCount = PAGE_SIZE;


// ========================================================
// MỤC 3: CÁC HÀM XỬ LÝ DỮ LIỆU & BẢO MẬT ẢNH
// ========================================================
// 3.1. Chống lỗi ảnh bị chặn bởi Shopee
function getSafeImageUrl(url) {
    if (!url || url.trim() === '') return 'https://via.placeholder.com/300x400?text=Hình+Ảnh';
    if (url.startsWith('./') || url.startsWith('/') || url.startsWith('data:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.trim())}`;
}

// 3.2. Chuẩn hóa dữ liệu đầu vào từ Google Sheets
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
// MỤC 4: TẢI VÀ GỘP DỮ LIỆU (API FETCHING)
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
// MỤC 5: HIỂN THỊ GIAO DIỆN SẢN PHẨM (RENDER UI)
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
        
        const safeImg = getSafeImageUrl(item.image);

        card.innerHTML = `
            <div class="product-img-wrap">
                <img src="${safeImg}" referrerpolicy="no-referrer" loading="lazy" alt="${item.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400?text=Hình+Ảnh';">
            </div>
            <div class="product-info-wrap">
                <div class="product-number">${item.id}</div>
                <div class="product-title">${item.name}</div>
            </div>
        `;
        container.appendChild(card);
    });

    // Cấu hình hiển thị nút "Xem thêm"
    if (loadMoreBtn) {
        loadMoreBtn.style.display = (visibleCount >= filteredProducts.length) ? 'none' : 'block';
    }
}

// Nạp thêm sản phẩm khi bấm nút Xem thêm
function loadMore() {
    visibleCount += PAGE_SIZE;
    renderProducts();
}


// ========================================================
// MỤC 6: BỘ LỌC TÌM KIẾM & DANH MỤC (FILTER LOGIC)
// ========================================================
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


// ========================================================
// MỤC 7: XỬ LÝ SỰ KIỆN KHI KHỞI TẠO TRANG (DOM LOADED)
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 7.1. Tải danh sách sản phẩm ban đầu
    loadProducts();

    // 7.2. Sự kiện Ô tìm kiếm & Nút xóa nhanh (X)
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (clearSearchBtn) {
                clearSearchBtn.style.display = this.value.trim().length > 0 ? 'flex' : 'none';
            }
            filterProducts();
        });
    }

    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            searchInput.focus();
            filterProducts();
        });
    }

    // 7.3. Sự kiện Menu Popup Danh mục (Trượt từ dưới lên)
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

            currentCategory = this.getAttribute('data-category');
            filterProducts();
            hideMenu();
        });
    });
});


// ========================================================
// MỤC 8: TIỆN ÍCH CUỘN VỀ ĐẦU TRANG (BACK TO TOP)
// ========================================================
// 8.1. Kiểm tra vị trí cuộn để ẩn/hiện nút (Chỉnh 300px để hiện chậm hơn)
window.addEventListener('scroll', function() {
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
        if (window.scrollY > 900 || document.documentElement.scrollTop > 900) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }
});

// 8.2. Sự kiện bấm cuộn mượt lên trên cùng
document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('#backToTopBtn')) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});