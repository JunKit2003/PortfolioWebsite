import { DataTypes, type QueryInterface } from "sequelize"

export async function up({ context: qi }: { context: QueryInterface }) {
  await qi.createTable("visits", {
    visitor_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    visit_date: { type: DataTypes.DATEONLY, primaryKey: true, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  })
}

export async function down({ context: qi }: { context: QueryInterface }) {
  await qi.dropTable("visits")
}
