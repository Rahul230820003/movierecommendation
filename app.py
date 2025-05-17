import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MultiLabelBinarizer

app = Flask(__name__)

# Load the dataset
movies = pd.read_csv('movies.csv')
movies['genres'] = movies['genres'].str.split('|')  # Split genres into lists

# Convert genres into a binary matrix
mlb = MultiLabelBinarizer()
genre_matrix = mlb.fit_transform(movies['genres'])

# Train KNN model
knn = NearestNeighbors(n_neighbors=6, metric='cosine', algorithm='brute')
knn.fit(genre_matrix)

# Add a clean title column for better searching
movies['clean_title'] = movies['title'].apply(lambda x: ' '.join(x.split('(')[:-1]).strip().lower())

def get_movie_recommendations(movie_title, n_recommendations=5):
    try:
        idx = movies[movies['title'] == movie_title].index[0]
        distances, indices = knn.kneighbors([genre_matrix[idx]], n_neighbors=n_recommendations+1)
        recommended_indices = indices.squeeze()[1:]  # Exclude the input movie
        
        # Get titles and genres for recommendations
        recommendations = movies.iloc[recommended_indices][['movieId', 'title', 'genres']]
        
        # Format genres as strings
        recommendations['genres'] = recommendations['genres'].apply(lambda x: '|'.join(x))
        
        # Extract year from title
        recommendations['year'] = recommendations['title'].apply(
            lambda x: x.split('(')[-1].replace(')', '') if '(' in x else 'Unknown'
        )
        
        return recommendations.to_dict('records')
    except (IndexError, KeyError):
        return []

def search_movies(query, max_results=10):
    query = query.lower()
    matching_movies = movies[movies['clean_title'].str.contains(query)]
    return matching_movies.head(max_results)[['movieId', 'title']].to_dict('records')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    if not query:
        return jsonify([])
    results = search_movies(query)
    return jsonify(results)

@app.route('/recommend', methods=['GET'])
def recommend():
    movie_title = request.args.get('title', '')
    if not movie_title:
        return jsonify([])
    recommendations = get_movie_recommendations(movie_title)
    return jsonify(recommendations)

if __name__ == '__main__':
    app.run(debug=True)