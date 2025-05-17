document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('movie-search');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const recommendationsContainer = document.getElementById('recommendations');
    
    // Debounce function to limit API calls during typing
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Search for movies as user types
    const debouncedSearch = debounce(function() {
        const query = searchInput.value.trim();
        if (query.length < 3) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }
        
        fetch(`/search?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    searchResults.innerHTML = '<div class="search-result-item">No movies found</div>';
                } else {
                    searchResults.innerHTML = data.map(movie => 
                        `<div class="search-result-item" data-title="${movie.title}">${movie.title}</div>`
                    ).join('');
                    
                    // Add click event to search results
                    document.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', function() {
                            const title = this.getAttribute('data-title');
                            searchInput.value = title;
                            searchResults.classList.remove('active');
                            getRecommendations(title);
                        });
                    });
                }
                searchResults.classList.add('active');
            })
            .catch(error => {
                console.error('Error:', error);
                searchResults.innerHTML = '<div class="search-result-item">Error searching for movies</div>';
                searchResults.classList.add('active');
            });
    }, 300);
    
    // Search input event listener
    searchInput.addEventListener('input', debouncedSearch);
    
    // Search button click event
    searchButton.addEventListener('click', function() {
        const title = searchInput.value.trim();
        if (title) {
            getRecommendations(title);
        }
    });
    
    // Get movie recommendations
    function getRecommendations(title) {
        recommendationsContainer.innerHTML = '<div class="loading">Loading recommendations...</div>';
        
        fetch(`/recommend?title=${encodeURIComponent(title)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    recommendationsContainer.innerHTML = '<div class="no-results">No recommendations found for this movie</div>';
                } else {
                    recommendationsContainer.innerHTML = data.map(movie => `
                        <div class="movie-card">
                            <h3>${movie.title}</h3>
                            <p class="year">${movie.year}</p>
                            <p>${movie.genres.replace(/\|/g, ', ')}</p>
                        </div>
                    `).join('');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                recommendationsContainer.innerHTML = '<div class="error">Error fetching recommendations</div>';
            });
    }
    
    // Close search results when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.classList.remove('active');
        }
    });
});