import './App.css';
import { useEffect, useState } from "react";
import "milligram";
import MovieForm from "./MovieForm";
import MoviesList from "./MoviesList";

function App() {
    const [movies, setMovies] = useState([]);
    const [addingMovie, setAddingMovie] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            const res = await fetch("/movies");
            if (res.ok) {
                const data = await res.json();
                setMovies(data);
            }
        };
        fetchMovies();
    }, []);

    async function handleAddMovie(movie) {
        const res = await fetch("/movies", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(movie)
        });
        if (res.ok) {
            const added = await res.json();
            const fullActors = movie.actors || [];
            setMovies([...movies, { ...movie, id: added.id, actors: fullActors }]);
            setAddingMovie(false);
        }
    }

    async function handleDeleteMovie(movie) {
        const res = await fetch(`/movies/${movie.id}`, { method: "DELETE" });
        if (res.ok) {
            setMovies(movies.filter(m => m.id !== movie.id));
        }
    }

    async function handleDeleteAll() {
        const res = await fetch(`/movies`, { method: "DELETE" });
        if (res.ok) {
            setMovies([]);
        }
    }

    async function handleUpdateMovie(movie) {
        const res = await fetch(`/movies/${movie.id}`, {
            method: "PUT",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(movie)
        });
        if (res.ok) {
            const updated = await res.json();
            setMovies(movies.map(m => (m.id === updated.id ? { ...m, ...updated, actors: movie.actors } : m)));
            setEditingMovie(null);
        }
    }

    return (
        <div className="container">
            <h1>My favourite movies to watch</h1>

            {movies.length === 0
                ? <p>No movies yet. Maybe add something?</p>
                : <MoviesList
                    movies={movies}
                    onDeleteMovie={handleDeleteMovie}
                    onEditMovie={setEditingMovie}
                />
            }

            <div style={{ marginTop: '10px' }}>
                {addingMovie
                    ? <MovieForm onMovieSubmit={handleAddMovie} buttonLabel="Add a movie" />
                    : <button onClick={() => setAddingMovie(true)}>Add a movie</button>
                }
                <button onClick={handleDeleteAll} style={{ marginLeft: '10px' }}>Delete All Movies</button>
            </div>

            {editingMovie && (
                <div style={{ marginTop: '10px' }}>
                    <MovieForm
                        onMovieSubmit={handleUpdateMovie}
                        buttonLabel="Save Changes"
                        initialData={editingMovie}
                    />
                </div>
            )}
        </div>
    );
}

export default App;