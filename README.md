Work-in-progress, basic overview:

| Method | Endpoint             | Request Body                                                                                            |
|--------|----------------------|---------------------------------------------------------------------------------------------------------|
| POST   | `/mutators`          | `{ name, points_multiplier, cvars: [ { name, value }, ... ] }`                                         |
| GET    | `/mutators`          |                                                                                                         |
| GET    | `/mutators/:id`      |                                                                                                         |
| POST   | `/tiers`             | `{ name, points }`                                                                                      |
| GET    | `/tiers`             |                                                                                                         |
| POST   | `/players`           | `{ name, steam }`                                                                                       |
| GET    | `/players`           | `{ q }`                                                                                                 |
| GET    | `/players/:id`       |                                                                                                         |
| POST   | `/maps`              | `{ name, file, tier }`                                                                                  |
| GET    | `/maps`              | `{ q }`                                                                                                 |
| GET    | `/maps/:id`          |                                                                                                         |
| POST   | `/rounds`            | `{ map }`                                                                                                |
| GET    | `/rounds`            | `{ offset, limit, player, map, sort }`                                                                 |
| GET    | `/rounds/:id`        |                                                                                                         |
| POST   | `/performances`      | `{ player, round, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned }`    |
| GET    | `/performances/:id`  |                                                                                                         |
| POST   | `/kills`             | `{ performance, kills: [ { player, npc_type, hitgroup }, ... ] }`                                       |
| GET    | `/leaderboards/exp`  |                                                                                                         |
| GET    | `/leaderboards/kills`|                                                                                                         |
| GET    | `/leaderboards/kdr`  |                                                                                                         |

