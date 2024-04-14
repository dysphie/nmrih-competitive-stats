import readFile from 'fs/promises'
import YAML from 'yaml'
import { disableAllMaps, disableAllMutators, disableAllTiers, registerMap, registerMutator, registerTier } from './queries.js'

const file = await readFile('./settings.yml', 'utf8')
const config = YAML.parse(file)

await disableAllMaps()
await disableAllMutators()
await disableAllTiers()

for (const tier of config.tiers) {
  await registerTier(tier.name, tier.points)
}

for (const mutator of config.mutators) {
  const cvars = []
  for (const cvar of mutator.cvars) {
    const [name, value = ''] = cvar.split(/\s+(.+)/, 2)
    cvars.push({ name, value })
  }

  await registerMutator(mutator.name, mutator.points_multiplier, cvars)
}

for (const map of config.maps) {
  await registerMap(map.name, map.tier, map.mutators)
}
