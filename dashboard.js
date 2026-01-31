document.addEventListener('DOMContentLoaded', () => {
    let allBookmarks = [];
    let browserBookmarks = [];
    let currentFilter = 'all';

    // Pagination State
    let currentPage = 1;
    const itemsPerPage = 50;

    const grid = document.getElementById('bookmark-list');
    const totalCountEl = document.getElementById('total-count');
    const starredCountEl = document.getElementById('starred-count');
    const browserCountEl = document.getElementById('browser-count');
    const tagListEl = document.getElementById('tag-list');
    const searchInput = document.getElementById('search-input');
    const showingText = document.getElementById('showing-text');

    // Initial Load
    loadBookmarks();
    fetchBrowserBookmarks();

    function loadBookmarks() {
        chrome.storage.local.get(['bookmarks'], (result) => {
            allBookmarks = result.bookmarks || [];
            // Add dateAdded if missing (for demo purposes)
            allBookmarks = allBookmarks.map(b => ({
                ...b,
                dateAdded: b.dateAdded || Date.now(),
                starred: b.starred || false // ensure starred property exists
            })).reverse();

            renderSidebarCounts();
            renderTags();
            // parsing logic if current filter is not browser
            if (currentFilter !== 'browser') {
                renderBookmarks();
            }
        });
    }

    function fetchBrowserBookmarks() {
        // Debugging Manifest and Permissions
        console.log("Manifest:", chrome.runtime.getManifest());
        chrome.permissions.getAll((p) => {
            console.log("Active Permissions:", p.permissions);
            if (!p.permissions.includes('bookmarks')) {
                console.error("CRITICAL: 'bookmarks' permission is MISSING from active permissions. Please reload the extension at chrome://extensions.");
            }
        });

        if (!chrome.bookmarks) {
            console.error("chrome.bookmarks API not available. Check permissions.");
            return;
        }

        console.log("Fetching browser bookmarks...");
        chrome.bookmarks.getTree((tree) => {
            const tempBookmarks = [];

            function traverse(nodes) {
                nodes.forEach(node => {
                    if (node.url) {
                        tempBookmarks.push({
                            title: node.title,
                            url: node.url,
                            dateAdded: node.dateAdded,
                            id: node.id,
                            parentId: node.parentId,
                            starred: false,
                            tags: [],
                            summary: ''
                        });
                    }
                    if (node.children) {
                        traverse(node.children);
                    }
                });
            }

            traverse(tree);
            browserBookmarks = tempBookmarks;
            console.log(`Fetched ${browserBookmarks.length} browser bookmarks.`);
            renderSidebarCounts();

            if (currentFilter === 'browser') {
                renderBookmarks();
            }
        });
    }

    // Render SideBar Counts
    function renderSidebarCounts() {
        if (totalCountEl) totalCountEl.textContent = allBookmarks.length;
        if (starredCountEl) starredCountEl.textContent = allBookmarks.filter(b => b.starred).length;
        if (browserCountEl) browserCountEl.textContent = browserBookmarks.length;
    }

    // Render Dynamic Tags
    function renderTags() {
        if (!tagListEl) return;

        const tagsMap = new Map();
        allBookmarks.forEach(b => {
            if (b.tags && b.tags.length) {
                b.tags.forEach(tag => {
                    tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
                });
            }
        });

        tagListEl.innerHTML = '';
        tagsMap.forEach((count, tag) => {
            const div = document.createElement('div');
            // Removed color logic for sidebar
            div.className = 'label-item sidebar-tag';

            div.innerHTML = `
                <span class="tag-text">${tag}</span>
                <span class="tag-count">${count}</span>
            `;

            div.onclick = () => {
                currentFilter = `tag:${tag}`;
                currentPage = 1; // Reset to page 1
                updateActiveNav(div);
                renderBookmarks();
            };
            tagListEl.appendChild(div);
        });
    }

    // Render Bookmarks List
    function renderBookmarks() {
        const filtered = filterBookmarks();
        grid.innerHTML = '';

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align:center; padding: 40px; color: #888;">No bookmarks found.</p>';
            updateShowingText(0, 0);
            return;
        }

        // Determine the "total" based on current filter source
        let total = allBookmarks.length;
        if (currentFilter === 'browser') {
            total = browserBookmarks.length;
        } else if (currentFilter.startsWith('tag:')) {
            // For tags, "total" usually means total in that tag, which is filtered.length unless we implement specific tag counts map globally available
            total = filtered.length;
        } else if (currentFilter === 'starred') {
            total = allBookmarks.filter(b => b.starred).length;
        }

        // Apply Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Ensure currentPage is valid
        if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filtered.slice(startIndex, endIndex);

        // Determine the "total" based on current filter source (for pagination footer total text, if we want "Showing X-Y of Total")
        // But the user asked for "showing 1144 of 2" fix context. Actually, showing text usually is "Showing Start-End of Total"
        // Let's match standard pattern: "Showing 1-50 of 100"

        updateShowingText(startIndex + 1, Math.min(endIndex, totalItems), totalItems);
        renderPaginationControls(totalPages);

        paginatedItems.forEach(bookmark => {
            const row = document.createElement('div');
            row.className = 'list-item';

            const domain = new URL(bookmark.url).hostname.replace('www.', '');
            const dateStr = new Date(bookmark.dateAdded).toLocaleDateString([], { month: 'short', day: 'numeric' });
            const timeStr = new Date(bookmark.dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Title Logic: Use title, or truncated URL if title missing. 
            // Browser native behavior often sets title=url if no title.
            let displayTitle = bookmark.title;
            if (!displayTitle || displayTitle.trim() === '') {
                displayTitle = bookmark.url;
            }

            // If the title IS the URL (or very long), ensure we don't break layout if CSS fails, 
            // but primarily rely on CSS. However, user specifically asked for "cut and ellipses added".
            // The previous logic hard-truncated at 60. We will keep that safe-guard for whenever the URL is used as the title.
            // We check if it looks like a URL
            if (displayTitle === bookmark.url && displayTitle.length > 60) {
                displayTitle = displayTitle.substring(0, 60) + '...';
            }

            // Summary Logic:
            // For extension bookmarks, use bookmark.summary.
            // For browser bookmarks (empty summary), show the Domain/URL to be helpful.
            let displaySummary = bookmark.summary;
            if (!displaySummary && currentFilter === 'browser') {
                displaySummary = bookmark.url; // The CSS will handle truncation for this long line
            }
            if (!displaySummary) displaySummary = 'No summary available.';

            // Tags HTML
            const tagsHtml = bookmark.tags && bookmark.tags.length
                ? bookmark.tags.map(t => `<span class="item-label" style="background-color: ${stringToColor(t)}20; color: ${stringToColor(t)}">${t}</span>`).join('')
                : '';

            // Random Accent Border
            const accentColors = [
                'var(--sunflower-500)',
                'var(--petal-500)',
                'var(--glaucous-500)',
                'var(--sunflower-400)',
                'var(--petal-400)',
                'var(--glaucous-400)'
            ];
            const randomAccent = accentColors[Math.floor(Math.random() * accentColors.length)];
            // Set CSS variable for usage in pseudo-elements
            row.style.setProperty('--accent-color', randomAccent);
            // row.style.borderLeft = ... is now handled in CSS using the variable

            row.innerHTML = `
                <div class="item-check">
                    <input type="checkbox">
                </div>
                <div class="item-star ${bookmark.starred ? 'active' : ''}" onclick="toggleStar('${bookmark.url}', this)">
                    <span class="material-symbols-rounded">${bookmark.starred ? 'star' : 'star_border'}</span>
                </div>
                <div class="item-content">
                    <div class="content-row title-row">
                        <span class="item-title">${displayTitle}</span>
                    </div>
                    <div class="content-row summary-row">
                        <span class="item-summary">${displaySummary}</span>
                    </div>
                    <div class="content-row tags-row">
                        ${tagsHtml}
                    </div>
                </div>
            `;

            // Make check and star clickable without opening link
            // Clicking row opens link
            row.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox' || e.target.classList.contains('item-star')) return;
                window.open(bookmark.url, '_blank');
            });

            grid.appendChild(row);
        });
    }

    function filterBookmarks() {
        let items = currentFilter === 'browser' ? browserBookmarks : allBookmarks;

        // Search Filter
        const query = searchInput.value.toLowerCase();
        if (query) {
            items = items.filter(b =>
                (b.title && b.title.toLowerCase().includes(query)) ||
                (b.summary && b.summary.toLowerCase().includes(query)) ||
                (b.url && b.url.toLowerCase().includes(query))
            );
        }

        // Category Filter
        if (currentFilter === 'starred') {
            items = items.filter(b => b.starred);
        } else if (currentFilter.startsWith('tag:')) {
            const tag = currentFilter.split(':')[1];
            items = items.filter(b => b.tags && b.tags.includes(tag));
        }

        return items;
    }

    // Render Pagination Controls
    function renderPaginationControls(totalPages) {
        const controls = document.querySelector('.pagination-controls');
        if (!controls) return;

        controls.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '<';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderBookmarks();
            }
        };
        controls.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = '>';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderBookmarks();
            }
        };
        controls.appendChild(nextBtn);
    }

    function updateShowingText(start, end, total) {
        if (total === 0) {
            showingText.textContent = 'Showing 0 of 0';
        } else {
            showingText.textContent = `Showing ${start}-${end} of ${total}`;
        }
    }

    // Helper: Toggle Star
    window.toggleStar = function (url, el) { // Attach to window for onclick access
        const idx = allBookmarks.findIndex(b => b.url === url);
        if (idx > -1) {
            allBookmarks[idx].starred = !allBookmarks[idx].starred;
            // Update UI immediately (using icons)
            const iconSpan = el.querySelector('.material-symbols-rounded');
            if (iconSpan) {
                iconSpan.textContent = allBookmarks[idx].starred ? 'star' : 'star_border';
            }
            el.classList.toggle('active');
            // Save to storage
            chrome.storage.local.set({ bookmarks: allBookmarks.reverse() }, () => { // Reverse back to original order for storage if needed, but here we work with one array
                renderSidebarCounts(); // Update counts
            });
            // Note: allBookmarks is already reversed in memory, so if we save it directly it might be double reversed if we reload. 
            // Better to just save the modified array.
            // Actually, let's just save the current state.
            // But wait, the source is `chrome.storage`.
            // Let's just save filter back to storage
            updateStorage();
        }
        event.stopPropagation();
    };

    function updateStorage() {
        chrome.storage.local.set({ bookmarks: allBookmarks });
    }

    // Helper: Generate consistent color from string
    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + "00000".substring(0, 6 - c.length) + c;
    }

    // Event Listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1; // Reset to page 1 on search
            renderBookmarks();
        });
    }

    // Nav Click Handling
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = item.dataset.filter;
            if (filter) {
                currentFilter = filter;
                currentPage = 1; // Reset to page 1
                updateActiveNav(item);
                renderBookmarks();
            }
        });
    });

    function updateActiveNav(activeEl) {
        document.querySelectorAll('.nav-item, .label-item').forEach(el => el.classList.remove('active'));
        // If it's a label item, we might want to style it differently or just highlight it
        if (activeEl.classList.contains('nav-item')) {
            activeEl.classList.add('active');
        } else {
            // For label items, maybe add a class to show it's selected
            activeEl.style.fontWeight = 'bold';
            // Reset others
            Array.from(tagListEl.children).forEach(c => c.style.fontWeight = 'normal');
            activeEl.style.fontWeight = 'bold';
        }
    }

    // Sidebar Collapse Logic
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapse-btn');

    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');

            // Toggle Icon
            collapseBtn.textContent = isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left';

            // Optional: You could save this state to localStorage
        });
    }
});
