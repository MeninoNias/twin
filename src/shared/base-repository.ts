import type {
  Database,
  PgTable,
  TableConfig,
  InferInsertModel,
} from "@/libs/drizzle";

export class BaseRepository<TTable extends PgTable<TableConfig>> {
  constructor(
    protected readonly db: Database,
    protected readonly table: TTable,
  ) {}

  async insertMany(rows: InferInsertModel<TTable>[]) {
    if (rows.length === 0) return;
    await this.db.insert(this.table).values(rows as any[]);
  }
}
