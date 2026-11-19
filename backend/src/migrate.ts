import type { Sequelize } from "sequelize"
import { SequelizeStorage, Umzug } from "umzug"

import * as m0001 from "./migrations/0001-create-contact-messages.js"
import * as m0002 from "./migrations/0002-create-visits.js"

// Listed statically (no glob) so the same list works from src/ under tsx and from compiled dist/.
const migrations = [
  { name: "0001-create-contact-messages", ...m0001 },
  { name: "0002-create-visits", ...m0002 },
]

export async function runMigrations(sequelize: Sequelize): Promise<void> {
  const umzug = new Umzug({
    migrations,
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
  })
  await umzug.up()
}
