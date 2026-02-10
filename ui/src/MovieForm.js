import { useState, useEffect } from "react";

export default function MovieForm(props) {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState('');
    const [director, setDirector] = useState('');
    const [description, setDescription] = useState('');
    const [actors, setActors] = useState([]);
    const [selectedActorIds, setSelectedActorIds] = useState([]);
    const [newActorName, setNewActorName] = useState('');

    useEffect(() => {
        const fetchActors = async () => {
            const res = await fetch("/actors");
            if (res.ok) {
                const data = await res.json();
                setActors(data);
            }
        };
        fetchActors();
    }, []);

    useEffect(() => {
        if (props.initialData) {
            setTitle(props.initialData.title || '');
            setYear(props.initialData.year || '');
            setDirector(props.initialData.director || '');
            setDescription(props.initialData.description || '');
            setSelectedActorIds(props.initialData.actor_ids || []);
        }
    }, [props.initialData]);

    async function addNewActor() {
        if (!newActorName) return;
        const res = await fetch('/actors', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: newActorName})
        });
        if (res.ok) {
            const actor = await res.json();
            setActors([...actors, actor]);
            setSelectedActorIds([...selectedActorIds, actor.id]);
            setNewActorName('');
        }
    }

    function toggleActor(id) {
        if (selectedActorIds.includes(id)) {
            setSelectedActorIds(selectedActorIds.filter(aid => aid !== id));
        } else {
            setSelectedActorIds([...selectedActorIds, id]);
        }
    }

    function submitMovie(event) {
        event.preventDefault();
        if (title.length < 1) return alert('Title is required');

        props.onMovieSubmit({
            id: props.initialData?.id,
            title,
            year,
            director,
            description,
            actor_ids: selectedActorIds,
            actors: actors.filter(a => selectedActorIds.includes(a.id))
        });

        setTitle('');
        setYear('');
        setDirector('');
        setDescription('');
        setSelectedActorIds([]);
    }

    return (
        <form onSubmit={submitMovie}>
            <h2>{props.buttonLabel || 'Submit'}</h2>

            <div>
                <label>Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
                <label>Year</label>
                <input type="text" value={year} onChange={e => setYear(e.target.value)} />
            </div>

            <div>
                <label>Director</label>
                <input type="text" value={director} onChange={e => setDirector(e.target.value)} />
            </div>

            <div>
                <label>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div>
                <label>New actor:</label>
                <input type="text" value={newActorName} onChange={e => setNewActorName(e.target.value)} />
                <button type="button" onClick={addNewActor}>Add Actor</button>
            </div>

            <div>
                <label>Select actors:</label>
                <div>
                    {actors.map(actor => (
                        <div key={actor.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                            <input
                                type="checkbox"
                                id={`actor-${actor.id}`}
                                checked={selectedActorIds.includes(actor.id)}
                                onChange={() => toggleActor(actor.id)}
                                style={{ marginRight: '8px' }}
                            />
                            <label htmlFor={`actor-${actor.id}`}>{actor.name}</label>
                        </div>
                    ))}
                </div>
            </div>

            <button>{props.buttonLabel || 'Submit'}</button>
        </form>
    );
}