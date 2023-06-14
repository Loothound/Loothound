import "reflect-metadata";

// eslint-disable-next-line @typescript-eslint/ban-types
type ClassDecorator = <TFunction extends Function>(
  target: TFunction
) => TFunction | void;

type PropertyDecorator = (target: object, propertyKey: string | symbol) => void;

const PkMetadataKey = Symbol("primaryKey");
const NnMetadataKey = Symbol("notNull");
const ColumnMetadataKey = Symbol("column");

function metadataOr(target, propertyKey, metadataKey, defaultValue) {
  return Reflect.hasMetadata(metadataKey, target, propertyKey)
    ? Reflect.getMetadata(metadataKey, target, propertyKey)
    : defaultValue;
}

function toDatatype(t): string {
  switch (t.name) {
    case "String":
      return "TEXT";
    case "Number":
      return "INTEGER";
  }
  return "UNKNOWN";
}

export const primaryKey: PropertyDecorator = Reflect.metadata(
  PkMetadataKey,
  "PRIMARY KEY"
);

export const notNull: PropertyDecorator = Reflect.metadata(
  NnMetadataKey,
  "NOT NULL"
);

export const columnName: (name: string) => PropertyDecorator = (name) => {
  return Reflect.metadata(ColumnMetadataKey, name);
};

export const table: (name: string) => <T extends Constructor>(target: T) => T =
  (name) => (target) => {
    const sample = target.create();
    const keys = Object.getOwnPropertyNames(sample);
    let fields = "";
    for (const key of keys) {
      const fieldName = metadataOr(sample, key, ColumnMetadataKey, key);
      const fieldType = `${toDatatype(
        Reflect.getMetadata("design:type", sample, key)
      )} ${metadataOr(sample, key, NnMetadataKey, "")} ${metadataOr(
        sample,
        key,
        PkMetadataKey,
        ""
      )}`;
      fields += `${fieldName} ${fieldType}, `;
    }
    fields = fields.slice(0, -2);
    const query = `CREATE TABLE IF NOT EXISTS ${name} (${fields});`;
    return class extends target {
      getCreateQuery(): string {
        return query;
      }
    };
  };
