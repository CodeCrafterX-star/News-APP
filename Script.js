const apiKey = "29afa269d3f8b8467fc2fd4b2e61f76c"; // Your GNews API key
const newsContainer = document.getElementById("newsContainer");
const searchInput = document.getElementById("searchInput");
const languageSelect = document.getElementById("languageSelect");
const categoryButtons = document.querySelectorAll(".category-btn");

const apiBaseUrl = "https://gnews.io/api/v4/";

// Mock response for testing in HTML Editor
const mockResponse = {
    articles: [
        {
            title: "Sample News Article 1",
            description: "This is a sample news article for testing purposes.",
            url: "https://example.com/article1",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Image+1"
        },
        {
            title: "Sample News Article 2",
            description: "Another sample news article for testing.",
            url: "https://example.com/article2",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Image+2"
        }
    ]
};

// Mock Bengali response for testing
const mockBengaliResponse = {
    articles: [
        {
            title: "নমুনা সংবাদ নিবন্ধ ১",
            description: "এটি পরীক্ষার জন্য একটি নমুনা সংবাদ নিবন্ধ।",
            url: "https://example.com/bengali-article1",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Bengali+Image+1"
        },
        {
            title: "নমুনা সংবাদ নিবন্ধ ২",
            description: "আরেকটি নমুনা সংবাদ নিবন্ধ পরীক্ষার জন্য।",
            url: "https://example.com/bengali-article2",
            urlToImage: "https://via.placeholder.com/300x160?text=Sample+Bengali+Image+2"
        }
    ]
};

let page = 1;

async function fetchNews(query = "top-headlines", pageNum = 1, retries = 2) {
    if (!newsContainer || !searchInput || !languageSelect) {
        console.error("DOM elements not found: newsContainer, searchInput, or languageSelect is null");
        newsContainer.innerHTML = '<p class="error">App initialization failed</p>';
        return;
    }

    newsContainer.innerHTML = '<p class="loading">Loading...</p>';
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

            if (data.articles?.length > 0) {
                displayNews(data.articles);
                // Add Load More button if more pages might be available
                if (data.articles.length >= 10) {
                    newsContainer.innerHTML += `<button class="load-more" onclick="fetchNews('${query}', ${pageNum + 1})">Load More</button>`;
                }
                return;
            } else {
                throw new Error("No news found.");
            }
        } catch (error) {
            console.error("Fetch error:", error.message);
            if (i === retries) {
                if (error.message.includes("403") || error.message.includes("429")) {
                    console.warn("403/429 Error: Likely API restrictions or rate limit. Using mock data for testing.");
                    const mockData = lang === "bn" ? mockBengaliResponse.articles : mockResponse.articles;
                    newsContainer.innerHTML = `
                        <p class="error">
                            API Error (${error.message.includes("403") ? "403 Forbidden" : "429 Too Many Requests"}): Test in a browser or local server for live data.<br>
                            Possible causes: Rate limit (100 requests/day), non-browser environment (HTML Editor), or API restrictions.<br>
                            Using mock data for now.
                        </p>
                        <button class="retry-btn" onclick="fetchNews('${query}', ${pageNum})">Retry</button>
                    `;
                    displayNews(mockData);
                } else {
                    newsContainer.innerHTML = `
                        <p class="error">Error fetching news: ${error.message}</p>
                        <button class="retry-btn" onclick="fetchNews('${query}', ${pageNum})">Retry</button>
                    `;
                }
            }
            console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}`);
        }
    }
}

function displayNews(articles) {
    if (!newsContainer) {
        console.error("newsContainer is null");
        return;
    }

    // Only clear if it's the first page
    if (page === 1) {
        newsContainer.innerHTML = "";
    }

    articles.forEach((article, index) => {
        if (!article.title || !article.url) {
            console.warn("Skipping invalid article:", article);
            return;
        }

        const newsCard = document.createElement("div");
        newsCard.classList.add("news-card");
        newsCard.style.animationDelay = `${index * 0.1}s`;
        const imageUrl = article.urlToImage || "https://via.placeholder.com/300x160?text=No+Image";

        newsCard.innerHTML = `
            <img src="${imageUrl}" alt="${article.title}" loading="lazy">
            <div class="news-card-content">
                <h3>${article.title}</h3>
                <p>${article.description || "No description available."}</p>
                <a href="${article.url}" target="_blank">Read more</a>
                <button class="share-btn" onclick="shareArticle('${article.title}', '${article.url}')">Share</button>
            </div>
        `;
        newsContainer.appendChild(newsCard);
    });
}

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

function searchNews() {
    if (!searchInput) {
        console.error("searchInput is null");
        return;
    }
    const query = searchInput.value.trim();
    page = 1; // Reset page on new search
    fetchNews(query || "top-headlines", page);
    searchInput.value = "";
}

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

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

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

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded at", new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
    page = 1;
    fetchNews();
    handlePullToRefresh();
});

searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        console.log("Search triggered via Enter key");
        searchNews();
    }
});
