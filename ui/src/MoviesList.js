import MovieListItem from "./MovieListItem";

export default function MoviesList(props) {
    return (
        <div>
            <h2>Movies</h2>
            <ul className="movies-list">
                {props.movies.map(movie => (
                    <li key={movie.id}>
                        <MovieListItem movie={movie} onDelete={() => props.onDeleteMovie(movie)} />
                        {movie.actors && movie.actors.length > 0 && (
                            <p>Actors: {movie.actors.map(actor => actor.name).join(', ')}</p>
                        )}
                        <button onClick={() => props.onEditMovie(movie)}>Edit</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}