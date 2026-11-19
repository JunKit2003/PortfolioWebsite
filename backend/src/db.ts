import { Sequelize } from "sequelize"

export function createSequelize(url: string): Sequelize {
  return new Sequelize(url, {
    dialect: "postgres",
    logging: false,
    pool: { max: 5, acquire: 10000 },
  })
}
