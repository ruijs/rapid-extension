import { pick, map, defaultTo, snakeCase } from 'lodash';
import pluralize from 'pluralize';
import { RapidEntity, RapidField, RapidFieldType } from './types/rapid-entity-types';

export function getRapidFieldRelation(fieldType: RapidFieldType): RapidField['relation'] {
  if (fieldType === 'relation') {
    return 'one';
  } else if (fieldType === 'relation[]') {
    return 'many';
  }
}

/**
 * 对字段进行自动配置。
 * @param sourceField 原始字段定义
 * @returns 自动配置后的字段
 * @description
 * 进行如下自动配置：
 * - 默认读取原始字段定义中的`code`，`name`，`description`，`fieldType`，`required`，`dictionaryCode`信息。
 * - 当没有为非关系型字段指定`columnName`时，将其自动配置为原始字段定义`code`字段的snake_case形式。
 * - 自动设置`relation`为`one`或`many`。
 * - 将`required`默认设置为`false`。
 */
export function autoConfigureRapidField(
  sourceField: RapidField,
): RapidField {
  const columnName =
    sourceField.type === 'relation' || sourceField.type === 'relation[]'
      ? null // 关系属性不应该设置`columnName`
      : sourceField?.columnName || snakeCase(sourceField.code);

  let field: RapidField = {
    code: sourceField.code,
    name: sourceField.name,
    description: sourceField.description,
    type: sourceField.type,
    required: defaultTo(sourceField.required, false),
    dataDictionary: sourceField.dataDictionary,
    columnName,
    defaultValue: sourceField.defaultValue,
    config: sourceField.config,
    relation: getRapidFieldRelation(sourceField.type),
    targetSingularCode: sourceField.targetSingularCode,
    linkTableName: sourceField.linkTableName,
    linkDbSchema: sourceField.linkDbSchema,
    targetIdColumnName: sourceField.targetIdColumnName,
    selfIdColumnName: sourceField.selfIdColumnName,

    minLength: sourceField.minLength,
    maxLength: sourceField.maxLength,
  };
  return field;
}

/**
 * 对实体进行自动配置。
 * @param sourceEntity 原始实体定义
 * @returns 自动配置后的实体
 * @description
 * 进行如下自动配置：
 * - 默认读取原始实体定义中的`code`，`name`和`description`信息
 * - 当没有指定`singularCode`时，将其自动配置为原始实体定义`code`字段的snake_case形式。
 * - 当没有指定`pluralCode`时，将其自动配置为实体`singularCode`字段的复数形式。
 * - 当没有指定`tableName`时，将其自动配置为实体`pluralCode`字段。
 */
export function autoConfigureRapidEntity(
  sourceEntity: RapidEntity,
): RapidEntity {
  const singularCode = sourceEntity.singularCode || snakeCase(sourceEntity.code);
  const pluralCode = sourceEntity.pluralCode || pluralize(singularCode);
  const tableName = sourceEntity.tableName || pluralCode;
  let entity: RapidEntity = {
    ...(pick(sourceEntity, ['code', 'name', 'description']) as any),

    namespace: sourceEntity.namespace,
    singularCode,
    pluralCode,
    dbSchema: sourceEntity.dbSchema,
    tableName,

    fields: autoConfigureRapidFields(sourceEntity),
  };

  return entity;
}

/**
 * 对实体中的字段进行自动配置，增加id字段以及创建时间，更新时间等字段
 */
function autoConfigureRapidFields(sourceEntity: RapidEntity) {
  let idFields: RapidField[] = [
    {
      name: 'id',
      code: 'id',
      type: 'integer',
      required: true,
      autoIncrement: true,
    },
  ];

  let auditFields: RapidField[] = [
    {
      name: '创建时间',
      code: 'createdAt',
      columnName: 'created_at',
      type: 'datetime',
      required: false,
      defaultValue: "now()",
    },
    {
      name: '创建人',
      code: 'createdBy',
      type: 'relation',
      relation: 'one',
      targetSingularCode: 'oc_user',
      targetIdColumnName: 'creator_id',
      required: false,
    },
    {
      name: '更新时间',
      code: 'updatedAt',
      columnName: 'updated_at',
      type: 'datetime',
      required: false,
    },
    {
      name: '更新人',
      code: 'updatedBy',
      type: 'relation',
      relation: 'one',
      targetSingularCode: 'oc_user',
      targetIdColumnName: 'updater_id',
      required: false,
    },
    {
      name: '删除时间',
      code: 'deletedAt',
      columnName: 'deteted_at',
      type: 'datetime',
      required: false,
    },
    {
      name: '删除人',
      code: 'detetedBy',
      type: 'relation',
      relation: 'one',
      targetSingularCode: 'oc_user',
      targetIdColumnName: 'deleter_id',
      required: false,
    },
  ];

  const userDefinedFields = map(sourceEntity.fields, autoConfigureRapidField);

  return [
    ...idFields,
    ...userDefinedFields,
    ...auditFields,
  ];
}
