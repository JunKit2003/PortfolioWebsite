import { DataTypes, type QueryInterface } from "sequelize"

export async function up({ context: qi }: { context: QueryInterface }) {
  await qi.createTable("contact_messages", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    email_sent_at: { type: DataTypes.DATE, allowNull: true },
    email_error: { type: DataTypes.TEXT, allowNull: true },
  })
}

export async function down({ context: qi }: { context: QueryInterface }) {
  await qi.dropTable("contact_messages")
}
