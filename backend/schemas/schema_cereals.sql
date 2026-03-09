CREATE TABLE IF NOT EXISTS data_cereals (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    manufacturer TEXT,
    type TEXT,
    calories INTEGER,
    protein INTEGER,
    fat INTEGER,
    sodium INTEGER,
    fiber FLOAT,
    carbs FLOAT,
    sugars INTEGER,
    potassium INTEGER,
    vitamins_minerals INTEGER,
    display_shelf TEXT,
    weight FLOAT,
    cups FLOAT,
    rating FLOAT,
    x FLOAT NOT NULL,       -- dimred x coordinate
    y FLOAT NOT NULL,       -- dimred y coordinate
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);
