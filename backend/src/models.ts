import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type Sequelize,
} from "sequelize"

export class ContactMessage extends Model<InferAttributes<ContactMessage>, InferCreationAttributes<ContactMessage>> {
  declare id: CreationOptional<string>
  declare name: string
  declare email: string
  declare message: string
  declare createdAt: CreationOptional<Date>
  declare emailSentAt: CreationOptional<Date | null>
  declare emailError: CreationOptional<string | null>
}

export class Visit extends Model<InferAttributes<Visit>, InferCreationAttributes<Visit>> {
  declare visitorId: string
  declare visitDate: string
  declare createdAt: CreationOptional<Date>
}

const initialised = new WeakSet<Sequelize>()

export function initModels(sequelize: Sequelize) {
  if (!initialised.has(sequelize)) {
    ContactMessage.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(254), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        createdAt: DataTypes.DATE,
        emailSentAt: { type: DataTypes.DATE, allowNull: true },
        emailError: { type: DataTypes.TEXT, allowNull: true },
      },
      { sequelize, tableName: "contact_messages", underscored: true, updatedAt: false },
    )
    Visit.init(
      {
        visitorId: { type: DataTypes.UUID, primaryKey: true },
        visitDate: { type: DataTypes.DATEONLY, primaryKey: true },
        createdAt: DataTypes.DATE,
      },
      { sequelize, tableName: "visits", underscored: true, updatedAt: false },
    )
    initialised.add(sequelize)
  }
  return { ContactMessage, Visit }
}
