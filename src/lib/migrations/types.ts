/**
 * A single upgrade step in the save data migration chain.
 * `migrate` receives the persisted state shaped like `fromVersion` and must
 * return state shaped like `toVersion`. Migrations run in sequence, so a
 * save several versions old is upgraded one step at a time.
 */
export interface SaveMigration {
  fromVersion: string
  toVersion: string
  // Input/output shapes vary per version, so this stays intentionally loose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (state: any) => any
}
