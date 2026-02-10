from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import sqlite3
import os

class Actor(BaseModel):
    name: str

class MovieWithActors(BaseModel):
    title: str
    year: str
    director: str = ""
    description: str = ""
    actor_ids: List[int] = []

app = FastAPI()
app.mount("/static", StaticFiles(directory="../ui/build/static", check_dir=False), name="static")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "movies.db")

def init_db():
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year TEXT,
            director TEXT,
            description TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS actors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS movie_actors (
            movie_id INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            FOREIGN KEY(movie_id) REFERENCES movies(id),
            FOREIGN KEY(actor_id) REFERENCES actors(id)
        )
    """)
    db.commit()
    db.close()

init_db()

@app.get("/")
def serve_react_app():
    return FileResponse("../ui/build/index.html")

@app.post("/actors")
def add_actor(actor: Actor):
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute("INSERT INTO actors (name) VALUES (?)", (actor.name,))
    actor_id = cursor.lastrowid
    db.commit()
    db.close()
    return {"id": actor_id, "name": actor.name}

@app.get("/actors")
def get_actors():
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    actors = cursor.execute("SELECT * FROM actors").fetchall()
    db.close()
    return [{"id": a[0], "name": a[1]} for a in actors]

@app.post("/movies")
def add_movie(movie: MovieWithActors):
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO movies (title, year, director, description) VALUES (?, ?, ?, ?)",
        (movie.title, movie.year, movie.director, movie.description)
    )
    movie_id = cursor.lastrowid
    for actor_id in movie.actor_ids:
        cursor.execute("INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)", (movie_id, actor_id))
    db.commit()
    db.close()
    return {"id": movie_id, "title": movie.title, "year": movie.year, "director": movie.director, "description": movie.description, "actor_ids": movie.actor_ids}

@app.put("/movies/{movie_id}")
def edit_movie(movie_id: int, movie: MovieWithActors):
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute(
        "UPDATE movies SET title=?, year=?, director=?, description=? WHERE id=?",
        (movie.title, movie.year, movie.director, movie.description, movie_id)
    )
    cursor.execute("DELETE FROM movie_actors WHERE movie_id=?", (movie_id,))
    for actor_id in movie.actor_ids:
        cursor.execute("INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)", (movie_id, actor_id))
    db.commit()
    db.close()
    return {"id": movie_id, "title": movie.title, "year": movie.year, "director": movie.director, "description": movie.description, "actor_ids": movie.actor_ids}

@app.get("/movies")
def get_movies():
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    movies = cursor.execute("SELECT * FROM movies").fetchall()
    output = []
    for m in movies:
        movie_id, title, year, director, description = m
        actor_ids = [row[0] for row in cursor.execute("SELECT actor_id FROM movie_actors WHERE movie_id=?", (movie_id,)).fetchall()]
        actors = []
        if actor_ids:
            placeholders = ",".join(["?"]*len(actor_ids))
            actors = [{"id": a[0], "name": a[1]} for a in cursor.execute(f"SELECT id,name FROM actors WHERE id IN ({placeholders})", actor_ids).fetchall()]
        output.append({"id": movie_id, "title": title, "year": year, "director": director, "description": description, "actors": actors})
    db.close()
    return output

@app.get("/movies/{movie_id}")
def get_single_movie(movie_id: int):
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    movie = cursor.execute("SELECT * FROM movies WHERE id=?", (movie_id,)).fetchone()
    if not movie:
        db.close()
        return {"message": "Movie not found"}
    movie_id, title, year, director, description = movie
    actor_ids = [row[0] for row in cursor.execute("SELECT actor_id FROM movie_actors WHERE movie_id=?", (movie_id,)).fetchall()]
    actors = []
    if actor_ids:
        placeholders = ",".join(["?"]*len(actor_ids))
        actors = [{"id": a[0], "name": a[1]} for a in cursor.execute(f"SELECT id,name FROM actors WHERE id IN ({placeholders})", actor_ids).fetchall()]
    db.close()
    return {"id": movie_id, "title": title, "year": year, "director": director, "description": description, "actors": actors}

@app.delete("/movies/{movie_id}")
def delete_movie(movie_id: int):
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute("DELETE FROM movies WHERE id=?", (movie_id,))
    cursor.execute("DELETE FROM movie_actors WHERE movie_id=?", (movie_id,))
    db.commit()
    db.close()
    return {"message": f"Movie with id={movie_id} deleted successfully"}

@app.delete("/movies")
def delete_movies():
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute("DELETE FROM movies")
    cursor.execute("DELETE FROM movie_actors")
    db.commit()
    db.close()
    return {"message": "All movies deleted successfully"}