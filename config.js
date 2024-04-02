import fs from 'fs'
import YAML from 'yaml'

const file = fs.readFileSync('./settings.yml', 'utf8')
const config = YAML.parse(file)

console.log(JSON.stringify(config, null, 2))

// TODO
