

POST /maps { file, name, tier }
GET /maps/search { partial_name }
GET /maps/:id

POST /rounds { map_id }
GET /rounds { offset, limit, player, map, sort }

GET /players/search { partial_name }
GET /players/:id
GET /players/:id/performances
GET /players/:id/completions

POST /tiers { name, points }
GET /tiers






