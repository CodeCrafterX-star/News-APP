// API Configuration
const apiKey = "29afa269d3f8b8467fc2fd4b2e61f76c"; // Your GNews API key
const apiBaseUrl = "https://gnews.io/api/v4/";

// DOM Elements
const newsContainer = document.getElementById("newsContainer");
const searchInput = document.getElementById("searchInput");
const languageSelect = document.getElementById("languageSelect");
const categoryButtons = document.querySelectorAll(".category-btn");

// Mock Data for Testing in HTML Editor
const mockResponse = {
    articles: [
        {
            title: "Sample News Article 1",
            description: "This is a sample news article for testing purposes.",
            url: "https://example.com/article1",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Image+1",
            publishedAt: "2025-05-26T08:58:00Z"
        },
        {
            title: "Sample News Article 2",
            description: "Another sample news article for testing.",
            url: "https://example.com/article2",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Image+2",
            publishedAt: "2025-05-26T08:58:00Z"
        }
    ]
};

// Mock Bengali Response
const mockBengaliResponse = {
    articles: [
        {
            title: "নমুনা সংবাদ নিবন্ধ ১",
            description: "এটি পরীক্ষার জন্য একটি নমুনা সংবাদ নিবন্ধ।",
            url: "https://example.com/bengali-article1",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Bengali+Image+1",
            publishedAt: "2025-05-26T08:58:00Z"
        },
        {
            title: "নমুনা সংবাদ নিবন্ধ ২",
            description: "আরেকটি নমুনা সংবাদ নিবন্ধ পরীক্ষার জন্য।",
            url: "https://example.com/bengali-article2",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Bengali+Image+2",
            publishedAt: "2025-05-26T08:58:00Z"
        }
    ]
};

// State
let page = 1;
let currentQuery = "top-headlines";
let isLoading = false;

// Fetch News Function
async function fetchNews(query = "top-headlines", pageNum = 1, retries = 2) {
    // Validate DOM Elements
    if (!newsContainer || !searchInput || !languageSelect) {
        console.error("DOM elements not found:", { newsContainer, searchInput, languageSelect });
        document.body.innerHTML = '<p class="error">App initialization failed: DOM elements missing.</p>';
        return;
    }

    // Prevent multiple simultaneous fetches
    if (isLoading) return;
    isLoading = true;

    // Update State
    currentQuery = query;
    if (pageNum === 1) {
        newsContainer.innerHTML = '<p class="loading">Loading...</p>';
    } else {
        // Add a temporary loading indicator for pagination
        const loadingDiv = document.createElement("div");
        loadingDiv.classList.add("loading");
        loadingDiv.textContent = "Loading more...";
        newsContainer.appendChild(loadingDiv);
    }
    updateActiveCategory(query);

    const lang = languageSelect.value;
    let url = `${apiBaseUrl}top-headlines?lang=${lang}&page=${pageNum}&token=${apiKey}`;
    if (query !== "top-headlines") {
        url = `${apiBaseUrl}search?q=${encodeURIComponent(query)}&lang=${lang}&page=${pageNum}&token=${apiKey}`;
    }

    // Add Bengali keyword for better results
    if (lang === "bn" && query === "top-headlines") {
        url += `&q=${encodeURIComponent("বাংলা")}`;
    }

    // Attempt to Fetch News
    for (let i = 0; i <= retries; i++) {
        try {
            console.log(`Attempt ${i + 1}/${retries + 1} - Fetching news from:`, url.replace(apiKey, "HIDDEN_API_KEY"));
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("API Response:", data);

            if (data.articles?.length > 0) {
                displayNews(data.articles, pageNum);
                isLoading = false;
                return;
            } else {
                throw new Error("No news articles found in the response.");
            }
        } catch (error) {
            console.error("Fetch error:", error.message);
            if (i === retries) {
                const mockData = lang === "bn" ? mockBengaliResponse.articles : mockResponse.articles;
                let errorMessage = "Error fetching news: " + error.message;
                if (error.message.includes("403") || error.message.includes("429")) {
                    errorMessage = `
                        API Error (${error.message.includes("403") ? "403 Forbidden" : "429 Too Many Requests"}): Test in a browser or local server for live data.<br>
                        Possible causes: Rate limit (100 requests/day) exceeded, non-browser environment (HTML Editor), or API restrictions.<br>
                        Using mock data for now. Rate limit resets on May 27, 2025.
                    `;
                }
                if (pageNum === 1) {
                    newsContainer.innerHTML = `
                        <p class="error">${errorMessage}</p>
                        <button class="retry-btn" onclick="fetchNews('${query}', ${pageNum})">Retry</button>
                    `;
                } else {
                    // Remove loading indicator for pagination
                    newsContainer.removeChild(newsContainer.lastChild);
                    const errorDiv = document.createElement("div");
                    errorDiv.classList.add("error");
                    errorDiv.innerHTML = errorMessage + `<br><button class="retry-btn" onclick="fetchNews('${query}', ${pageNum})">Retry</button>`;
                    newsContainer.appendChild(errorDiv);
                }
                displayNews(mockData, pageNum);
            }
            console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}`);
        }
    }
    isLoading = false;
}

// Display News Articles
function displayNews(articles, pageNum) {
    if (!newsContainer) {
        console.error("newsContainer is null");
        return;
    }

    // Remove loading indicator
    if (newsContainer.lastChild?.classList?.contains("loading")) {
        newsContainer.removeChild(newsContainer.lastChild);
    }

    // Clear container only on the first page
    if (pageNum === 1) {
        newsContainer.innerHTML = "";
    }

    articles.forEach((article, index) => {
        if (!article.title || !article.url) {
            console.warn("Skipping invalid article:", article);
            return;
        }

        const newsCard = document.createElement("div");
        newsCard.classList.add("news-card");

        const imageUrl = article.urlToImage || article.image || "https://via.placeholder.com/300x160?text=No+Image";
        const description = article.description || article.content || "No description available.";
        const title = article.title || "Untitled Article";

        newsCard.innerHTML = `
            <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x160?text=Image+Failed'">
            <div class="news-card-content">
                <h3>${title}</h3>
                <p>${description.slice(0, 150)}${description.length > 150 ? "..." : ""}</p>
                <a href="${article.url}" target="_blank">Read more</a>
                <button class="share-btn" onclick="shareArticle('${title}', '${article.url}')">Share</button>
            </div>
        `;
        newsContainer.appendChild(newsCard);
    });

    // Add Load More button if more articles might be available
    if (articles.length >= 10) {
        const existingLoadMore = newsContainer.querySelector(".load-more");
        if (existingLoadMore) {
            newsContainer.removeChild(existingLoadMore);
        }
        const loadMoreButton = document.createElement("button");
        loadMoreButton.classList.add("load-more");
        loadMoreButton.textContent = "Load More";
        loadMoreButton.onclick = () => {
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = "Loading...";
            fetchNews(currentQuery, pageNum + 1);
        };
        newsContainer.appendChild(loadMoreButton);
    }
}

// Share Article Function
function shareArticle(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).then(() => {
            console.log("Article shared successfully");
        }).catch((error) => {
            console.error("Error sharing article:", error);
        });
    } else {
        console.warn("Web Share API not supported. Copying URL to clipboard.");
        navigator.clipboard.writeText(url).then(() => {
            alert("Article URL copied to clipboard!");
        }).catch((error) => {
            console.error("Error copying URL:", error);
        });
    }
}

// Search News Function
function searchNews() {
    if (!searchInput) {
        console.error("searchInput is null");
        return;
    }
    const query = searchInput.value.trim();
    page = 1;
    fetchNews(query || "top-headlines", page);
    searchInput.value = "";
}

// Update Active Category
function updateActiveCategory(query) {
    if (!categoryButtons) {
        console.error("categoryButtons not found");
        return;
    }
    categoryButtons.forEach(btn => {
        btn.classList.remove("active");
        if (btn.textContent.toLowerCase() === query || (query === "top-headlines" && btn.textContent === "Top")) {
            btn.classList.add("active");
        }
    });
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

// Pull-to-Refresh
function handlePullToRefresh() {
    let touchStartY = 0;
    document.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
    });
    document.addEventListener("touchend", (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY - touchStartY > 100 && window.scrollY === 0) {
            console.log("Pull-to-refresh triggered");
            page = 1;
            fetchNews(searchInput?.value.trim() || "top-headlines", page);
        }
    });
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded at", new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // Check DOM Elements
    if (!newsContainer || !searchInput || !languageSelect || !categoryButtons) {
        console.error("Critical DOM elements missing:", { newsContainer, searchInput, languageSelect, categoryButtons });
        document.body.innerHTML = '<p class="error">App initialization failed: Critical DOM elements missing.</p>';
        return;
    }

    // Apply Theme
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    // Initial Fetch
    page = 1;
    fetchNews();

    // Add Event Listeners
    handlePullToRefresh();
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            console.log("Search triggered via Enter key");
            searchNews();
        }
    });
});

// Global Error Handler
window.onerror = function (message, source, lineno, colno, error) {
    console.error("Global error:", { message, source, lineno, colno, error });
    if (newsContainer) {
        newsContainer.innerHTML = `
            <p class="error">
                An unexpected error occurred: ${message}<br>
                Please try refreshing the app or testing in a browser.
            </p>
        `;
    }
};
