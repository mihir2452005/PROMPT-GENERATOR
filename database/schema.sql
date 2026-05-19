
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  password VARCHAR(255)
);

CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  prompt TEXT,
  mood VARCHAR(100)
);
