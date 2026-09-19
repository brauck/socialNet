DROP DATABASE IF EXISTS vk;
CREATE DATABASE vk;
\c vk;

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(120) UNIQUE,
    phone BIGINT
);
COMMENT ON COLUMN users.lastname IS 'Фамилия';

CREATE INDEX users_phone_idx ON users(phone);
CREATE INDEX users_firstname_lastname_idx ON users(firstname, lastname);

DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX messages_from_user_id ON messages(from_user_id);
CREATE INDEX messages_to_user_id ON messages(to_user_id);

ALTER TABLE messages
    ADD CONSTRAINT fk_messages_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT fk_messages_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;

DROP TABLE IF EXISTS friend_requests CASCADE;
CREATE TABLE friend_requests (
    initiator_user_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('requested', 'approved', 'unfriended', 'declined')),
    requested_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    PRIMARY KEY (initiator_user_id, target_user_id)
);

CREATE INDEX friend_requests_initiator_idx ON friend_requests(initiator_user_id);
CREATE INDEX friend_requests_target_idx ON friend_requests(target_user_id);

ALTER TABLE friend_requests
    ADD CONSTRAINT fk_friend_requests_initiator FOREIGN KEY (initiator_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE,
    ADD CONSTRAINT fk_friend_requests_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;

DROP TABLE IF EXISTS communities CASCADE;
CREATE TABLE communities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150)
);

CREATE INDEX communities_name_idx ON communities(name);

DROP TABLE IF EXISTS users_communities CASCADE;
CREATE TABLE users_communities (
    user_id BIGINT NOT NULL,
    community_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, community_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON UPDATE CASCADE ON DELETE CASCADE
);

DROP TABLE IF EXISTS media_types CASCADE;
CREATE TABLE media_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS media CASCADE;
CREATE TABLE media (
    id BIGSERIAL PRIMARY KEY,
    media_type_id BIGINT,
    user_id BIGINT NOT NULL,
    body TEXT,
    filename VARCHAR(255),
    size INT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX media_user_id_idx ON media(user_id);

ALTER TABLE media
    ADD CONSTRAINT fk_media_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT fk_media_media_type FOREIGN KEY (media_type_id) REFERENCES media_types(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Триггер для обновления updated_at (замена ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_updated_at_trigger
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    media_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON UPDATE CASCADE ON DELETE CASCADE
);

DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    user_id BIGINT PRIMARY KEY,
    gender CHAR(1),
    birthday DATE,
    photo_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    hometown VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL
);