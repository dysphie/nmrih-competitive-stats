> [!IMPORTANT]  
> This repository is a work-in-progress

Quick summary

| Method | Endpoint             | Request Body                                                                                              | Description                                           |
|--------|----------------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| POST   | `/mutators`          | `{ name, points_multiplier, cvars: [ { name, value }, ... ] }`                                            | Register a new mutator                                |
| GET    | `/mutators`          |                                                                                                           | Get a list of existing mutators                      |
| GET    | `/mutators/:id`      |                                                                                                           | Get a mutator by ID                            |
| POST   | `/tiers`             | `{ name, points }`                                                                                        | Register a new map tier                               |
| GET    | `/tiers`             |                                                                                                           | Get a list of map tiers                               |
| POST   | `/players`           | `{ name, steam }`                                                                                         | Register a new player                                 |
| GET    | `/players`           | `{ q }`                                                                                                   | Get a list of players whose name partially matches the query |
| GET    | `/players/:id`       |                                                                                                           | Get player by ID                                      |
| GET    | `/players/:id/kills` |                                                                                                           | Get player kill stats                   |
| POST   | `/maps`              | `{ name, tier }`                                                                                    | Register a new map                                    |
| GET    | `/maps`              | `{ q }`                                                                                                   | Get a list of maps whose name partially matches the query |
| GET    | `/maps/:id`          |                                                                                                           | Get a map by ID                                       |
| POST   | `/rounds`            | `{ map, mutators: [ id, ... ] }`                                                                                                 | Register a new played round                           |
| GET    | `/rounds`            | `{ offset, limit, player, map, sort }`                                                                    | Get a list of rounds based on filters and sort order  |
| GET    | `/rounds/:id`        |                                                                                                           | Get a round by ID                                     |
| POST   | `/performances`      | `{ player, round, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned }`     | Register a new player performance for a given round   |
| GET    | `/performances/:id`  |                                                                                                           | Get a performance by ID                               |
| POST   | `/kills`             | `{ performance, kills: [ { player, npc_type, hitgroup }, ... ] }`                                         | Register kills issued during a performance            |
| GET    | `/leaderboards/exp`  |                                                                                                           | Get a list of players sorted by most experience       |
| GET    | `/leaderboards/kills`|                                                                                                           | Get a list of players sorted by most kills            |
| GET    | `/leaderboards/kdr`  |                                                                                                           | Get a list of players sorted by highest kill-death ratio |
