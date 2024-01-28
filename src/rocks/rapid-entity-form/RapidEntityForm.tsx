import type { RockEvent, Rock, RockEventHandler } from "@ruiapp/move-style";
import { handleComponentEvent } from "@ruiapp/move-style";
import { renderRock } from "@ruiapp/react-renderer";
import RapidEntityFormMeta from "./RapidEntityFormMeta";
import type { RapidEntityFormRockConfig } from "./rapid-entity-form-types";
import { filter, find, map, uniq } from "lodash";
import rapidAppDefinition from "../../rapidAppDefinition";
import type { RapidDataDictionary, RapidEntity, RapidField, RapidFieldType } from "../../types/rapid-entity-types";
import { generateRockConfigOfError } from "../../rock-generators/generateRockConfigOfError";
import type { EntityStoreConfig } from "../../stores/entity-store";
import type { RapidFormItemConfig, RapidFormItemType } from "../rapid-form-item/rapid-form-item-types";
import type { RapidFormRockConfig } from "../rapid-form/rapid-form-types";
import type { RapidSelectConfig } from "../rapid-select/rapid-select-types";
import { RapidOptionFieldRendererConfig } from "../rapid-option-field-renderer/rapid-option-field-renderer-types";


const fieldTypeToFormItemTypeMap: Record<RapidFieldType, RapidFormItemType | null> = {
  text: 'text',
  boolean: 'switch',
  integer: 'number',
  long: 'number',
  float: 'number',
  double: 'number',
  decimal: 'number',
  date: 'date',
  time: 'time',
  datetime: 'datetime',
  datetimetz: 'datetime',
  option: 'select',
  relation: 'select',
  'relation[]': 'select',
  json: 'json',
};

const validationMessagesByFieldType: Partial<Record<RapidFieldType, any>> = {
  option: {
    // eslint-disable-next-line no-template-curly-in-string
    required: "请选择${label}",
  },

  relation: {
    // eslint-disable-next-line no-template-curly-in-string
    required: "请选择${label}",
  },
}

const defaultValidationMessages = {
    // eslint-disable-next-line no-template-curly-in-string
  required: "请输入${label}",
}

export interface GenerateEntityFormItemOption {
  formItemConfig: RapidFormItemConfig;
  mainEntity: RapidEntity;
  entities: RapidEntity[];
  dataDictionaries: RapidDataDictionary[]; 
}

function generateDataFormItemForOptionProperty(option: GenerateEntityFormItemOption) {
  const { formItemConfig, mainEntity } = option;

  const rpdField = find(mainEntity.fields, {code: formItemConfig.code})!;
  const dataDictionaryCode = rpdField.dataDictionary;
  let dataDictionary = find(option.dataDictionaries, {code: dataDictionaryCode});

  let formControlProps: Partial<RapidSelectConfig> = {
    allowClear: !formItemConfig.required,
    placeholder: formItemConfig.placeholder,
    listDataSource: {
      data: {
        list: dataDictionary?.entries || [],
      },
    },
    listTextFieldName: "name",
    listValueFieldName: "value",
    ...formItemConfig.formControlProps,
  };
  let rendererProps: RapidOptionFieldRendererConfig = {
    dictionaryCode: dataDictionaryCode,
  }
  let formItem: RapidFormItemConfig = {
    type: formItemConfig.type,
    valueFieldType: "option",
    code: formItemConfig.code,
    required: formItemConfig.required,
    label: formItemConfig.label,
    formControlProps,
    rendererProps,
    $exps: formItemConfig.$exps,
  };
  return formItem;
}

export function generateDataFormItemForRelationProperty(option: GenerateEntityFormItemOption, field: RapidField) {
  const { formItemConfig } = option;

  let listDataSourceCode = formItemConfig.formControlProps?.listDataSourceCode;
  if (!listDataSourceCode) {
    listDataSourceCode = `dataFormItemList-${formItemConfig.code}`;
  }

  let formControlProps: Partial<RapidSelectConfig> = {
    allowClear: !formItemConfig.required,
    placeholder: formItemConfig.placeholder,
    valueFieldName: "id",
    ...formItemConfig.formControlProps,
    listDataSourceCode,
  };

  let formItem: RapidFormItemConfig = {
    type: formItemConfig.type,
    valueFieldType: "relation",
    multipleValues: field.relation === "many",
    code: formItemConfig.code,
    required: formItemConfig.required,
    label: formItemConfig.label,
    formControlType: formItemConfig.formControlType,
    formControlProps,
    rendererType: formItemConfig.rendererType,
    rendererProps: formItemConfig.rendererProps,
    $exps: formItemConfig.$exps,
  };
  return formItem;
}


function generateDataFormItem(option: GenerateEntityFormItemOption) {
  const { formItemConfig, mainEntity } = option;

  const rpdField = find(mainEntity.fields, {code: formItemConfig.code})!;
  if (!rpdField) {
    console.warn(`Field with code '${formItemConfig.code}' not found.`);
  }

  let valueFieldType = formItemConfig.valueFieldType || rpdField?.type || "text";

  if (valueFieldType === "option") {
    return generateDataFormItemForOptionProperty(option);
  } else if (valueFieldType === "relation" || valueFieldType === "relation[]") {
    return generateDataFormItemForRelationProperty(option, rpdField);
  }

  let formItem: Omit<RapidFormItemConfig, "$type"> = {
    type: formItemConfig.type,
    code: formItemConfig.code,
    required: formItemConfig.required,
    label: formItemConfig.label,
    hidden: formItemConfig.hidden,
    valueFieldType,
    valueFieldName: formItemConfig.valueFieldName,
    multipleValues: formItemConfig.multipleValues,
    formControlType: formItemConfig.formControlType,
    formControlProps: formItemConfig.formControlProps,
    rendererType: formItemConfig.rendererType,
    rendererProps: formItemConfig.rendererProps,
    $exps: formItemConfig.$exps,
  }

  return formItem;
}

export default {
  onInit(context, props) {
    const entities = rapidAppDefinition.getEntities();
    const mainEntityCode = props.entityCode;
    const mainEntity = find(entities, item => item.code === mainEntityCode);
    if (!mainEntity) {
      return;
    }

  for (const formItem of props.items) {
    const field = find(mainEntity.fields, { code: formItem.code });
    if (field) {
      // 使用字段名称作为表单项的标签
      if (!formItem.label) {
        formItem.label = field?.name;
      }

      if (!formItem.hasOwnProperty('required')) {
        // 使用字段的必填设置作为表单项的必填设置
        formItem.required = field.required;
      }
    }

    let fieldType = formItem.valueFieldType || field?.type || "text";
    if (formItem.type === 'auto') {
      // 根据字段的类型选择合适的表单项类型
      formItem.type = fieldTypeToFormItemTypeMap[fieldType] || "text";
    }
  }

    if (props.mode != "new") {
      const properties: string[] = uniq(props.queryProperties || [
        'id',
        ...map(filter(props.items, item => !!item.code), item => item.code),
        ...props.extraProperties || [],
      ]);
      const detailDataStoreConfig: EntityStoreConfig = {
        type: "entityStore",
        name: props.dataSourceCode || "detail",
        entityModel: mainEntity,
        properties,
        filters: [
          {
            field: "id",
            operator: "eq",
            value: "",
          }
        ],
        // TODO: Expression should be a static string, so that we can configure it at design time.
        $exps: {
          frozon: `!(${props.$exps?.entityId || `${props.entityId}`})`,
          "filters[0].value": props.$exps?.entityId || `${props.entityId}`,
        }
      };
      context.scope.addStore(detailDataStoreConfig);
    }

    if (props.items) {
      props.items.forEach((formItemConfig) => {
        const rpdField = find(mainEntity.fields, {code: formItemConfig.code})!;
        if (!rpdField) {
          return;
        }

        if (rpdField.type === "relation" || rpdField.type === "relation[]") {
          let listDataSourceCode = formItemConfig.formControlProps?.listDataSourceCode;
          if (listDataSourceCode) {
            // use specified data store.
            return;
          }

          const listDataStoreName = `dataFormItemList-${formItemConfig.code}`;

          const rpdField = find(mainEntity.fields, {code: formItemConfig.code})!;
          const targetEntity = find(entities, {singularCode: rpdField.targetSingularCode})!;

          let { listDataFindOptions = {} } = formItemConfig;

          const listDataStoreConfig: EntityStoreConfig = {
            type: "entityStore",
            name: listDataStoreName,
            entityModel: targetEntity,
            fixedFilters: listDataFindOptions.fixedFilters,
            filters: listDataFindOptions.filters,
            properties: listDataFindOptions.properties || [],
            orderBy: listDataFindOptions.orderBy || [
              {
                field: 'id',
              }
            ],
            pagination: listDataFindOptions.pagination,
            $exps: listDataFindOptions.$exps,
          };

          context.scope.addStore(listDataStoreConfig);
        }
      })
    }
  },

  onReceiveMessage(message, state, props) {
    if (message.name === "submit") {
      message.page.sendComponentMessage(`${props.$id}-rapidForm`, {
        name: "submit"
      });
    } else if (message.name === "setFieldsValue") {
      message.page.sendComponentMessage(`${props.$id}-rapidForm`, {
        name: "setFieldsValue",
        payload: message.payload,
      });
    } else if (message.name === "resetFields") {
      message.page.sendComponentMessage(`${props.$id}-rapidForm`, {
        name: "resetFields"
      });
    } else if (message.name === "refreshView") {
      message.page.sendComponentMessage(`${props.$id}-rapidForm`, {
        name: "refreshView"
      });
    }
  },

  Renderer(context, props, state) {
    const entities = rapidAppDefinition.getEntities();
    const dataDictionaries = rapidAppDefinition.getDataDictionaries();
    const formConfig = props;
    const mainEntityCode = formConfig.entityCode;
    const mainEntity = find(entities, item => item.code === mainEntityCode);
    if (!mainEntity) {
      const errorRockConfig = generateRockConfigOfError(new Error(`Entitiy with code '${mainEntityCode}' not found.`))
      return renderRock({context, rockConfig: errorRockConfig});
    }

    const formItems: RapidFormItemConfig[] = [];

    if (formConfig && formConfig.items) {
      formConfig.items.forEach((formItemConfig) => {
        const formItem = generateDataFormItem({
          formItemConfig,
          mainEntity,
          entities,
          dataDictionaries,
        });

        if (formConfig.mode === "view") {
          formItem.required = false;
          formItem.mode = "display";
        } else {
          // auto config formItem.rules
          const validationMessagesOfFieldType = validationMessagesByFieldType[formItem.valueFieldType!]
          if (formItem.required) {
            if (!formItem.rules || !formItem.rules.length) {
              formItem.rules = [
                {
                  required: true,
                  message: validationMessagesOfFieldType?.required || defaultValidationMessages.required }
              ]
            }
          }
        }
        formItems.push(formItem as RapidFormItemConfig);
      })
    }
  
    const formOnFinish: RockEventHandler[] = [
      {
        $action: "saveRapidEntity",
        entityNamespace: mainEntity.namespace,
        entityPluralCode: mainEntity.pluralCode,
        entityId: props.entityId,
        fixedFields: props.fixedFields,
      },
      {
        $action: "script",
        script: async (event: RockEvent) => {
          if (formConfig.onSaveSuccess) {
            await handleComponentEvent("onSaveSuccess", event.framework, event.page as any, event.scope, event.sender, formConfig.onSaveSuccess, null);
          }
        }
      }
    ];

    const rockConfig: RapidFormRockConfig = {
      $id: `${props.$id}-rapidForm`,
      $type: "rapidForm",
      column: formConfig.column,
      items: formItems,
      actions: formConfig.actions,
      dataSourceCode: formConfig.mode === "new" ? null : props.dataSourceCode || "detail",
      onFinish: formConfig.mode === "view" ? null : formOnFinish,
      defaultFormFields: formConfig.defaultFormFields,
      onFormRefresh: formConfig.onFormRefresh,
      onValuesChange: formConfig.onValuesChange,
    };
    return renderRock({context, rockConfig});
  },

  ...RapidEntityFormMeta
} as Rock<RapidEntityFormRockConfig>;