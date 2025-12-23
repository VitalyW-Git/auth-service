import { Migration } from '@mikro-orm/migrations'

// Таблица услуг клиники: services → clinic_services, чтобы имя не путалось с сервисами NestJS
// и будущими услугами тарифа самого продукта.
export class Migration20261011182609_RenameServicesToClinicServices extends Migration {
	override async up(): Promise<void> {
		// Комментарии к колонкам, данные и внешний ключ appointments_service_id_foreign переезжают вместе с таблицей.
		this.addSql(`alter table "services" rename to "clinic_services";`)
		// Первичный ключ переименовывается вместе со своим индексом.
		this.addSql(
			`alter table "clinic_services" rename constraint "services_pkey" to "clinic_services_pkey";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_clinic_id_foreign" to "clinic_services_clinic_id_foreign";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_duration_minutes_check" to "clinic_services_duration_minutes_check";`
		)
		this.addSql(
			`alter index "services_clinic_id_index" rename to "clinic_services_clinic_id_index";`
		)
		// Именованные NOT NULL-ограничения PostgreSQL 18 — чтобы в схеме не осталось старого имени таблицы.
		this.addSql(
			`alter table "clinic_services" rename constraint "services_id_not_null" to "clinic_services_id_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_name_not_null" to "clinic_services_name_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_duration_minutes_not_null" to "clinic_services_duration_minutes_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_clinic_id_not_null" to "clinic_services_clinic_id_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_created_at_not_null" to "clinic_services_created_at_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "services_updated_at_not_null" to "clinic_services_updated_at_not_null";`
		)
		this.addSql(
			`comment on column "appointments"."service_id" is 'Booked service, references clinic_services';`
		)
	}

	override async down(): Promise<void> {
		this.addSql(
			`comment on column "appointments"."service_id" is 'Booked service, references services';`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_updated_at_not_null" to "services_updated_at_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_created_at_not_null" to "services_created_at_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_clinic_id_not_null" to "services_clinic_id_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_duration_minutes_not_null" to "services_duration_minutes_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_name_not_null" to "services_name_not_null";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_id_not_null" to "services_id_not_null";`
		)
		this.addSql(
			`alter index "clinic_services_clinic_id_index" rename to "services_clinic_id_index";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_duration_minutes_check" to "services_duration_minutes_check";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_clinic_id_foreign" to "services_clinic_id_foreign";`
		)
		this.addSql(
			`alter table "clinic_services" rename constraint "clinic_services_pkey" to "services_pkey";`
		)
		this.addSql(`alter table "clinic_services" rename to "services";`)
	}
}
