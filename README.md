

POST /performances { player, round, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned }

POST /maps { file, name, tier }
GET /maps { name }
GET /maps/:id

POST /rounds { map_id }
GET /rounds { offset, limit, player, map, sort }

GET /players { name }
GET /players/:id
GET /players/:id/performances
GET /players/:id/completions

POST /tiers { name, points }
GET /tiers






