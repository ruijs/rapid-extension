import type { Rock, RockChildrenConfig, RockConfig, RockEvent } from "@ruiapp/move-style";
import { renderRock, renderRockChildren } from "@ruiapp/react-renderer";
import RapidEntityListMeta from "./RapidEntityListMeta";
import type { RapidEntityListRockConfig, RapidEntityListState } from "./rapid-entity-list-types";
import { filter, find, forEach, map, merge, set, uniq } from "lodash";
import rapidAppDefinition from "../../rapidAppDefinition";
import { generateRockConfigOfError } from "../../rock-generators/generateRockConfigOfError";
import type { RapidToolbarRockConfig } from "../rapid-toolbar/rapid-toolbar-types";
import type { RapidFieldType, RapidEntity, RapidField } from "../../types/rapid-entity-types";
import type { EntityStore, EntityStoreConfig } from "../../stores/entity-store";

const fieldTypeToDisplayRockTypeMap: Record<RapidFieldType, string> = {
  text: "rapidTextRenderer",
  integer: "rapidNumberRenderer",
  long: "rapidNumberRenderer",
  float: "rapidNumberRenderer",
  double: "rapidNumberRenderer",
  decimal: "rapidNumberRenderer",
  boolean: "rapidBoolRenderer",
  date: "rapidDateTimeRenderer",
  time: "rapidDateTimeRenderer",
  datetime: "rapidDateTimeRenderer",
  datetimetz: "rapidDateTimeRenderer",
  option: "rapidOptionFieldRenderer",
  relation: "rapidObjectRenderer",
  "relation[]": "rapidObjectRenderer",
  json: "rapidJsonRenderer",
};

const defaultCellDisplayPropsOfFieldTypes: Record<string, Record<string, any>> = {
  date: {
    format: "YYYY-MM-DD",
  },

  datetime: {
    format: "YYYY-MM-DD HH:mm:ss",
  },

  boolean: {
    trueText: "是",
    falseText: "否",
    defaultText: "-",
  }
}

const defaultCellDisplayPropsOfRendererTypes: Record<string, Record<string, any>> = {
}

export default {
  onResolveState(props, state) {
    return {
      selectedIds: [],
    }
  },

  onInit(context, props) {
    const entities = rapidAppDefinition.getEntities();
    const entityCode = props.entityCode;
    if (!entityCode) {
      return;
    }

    const mainEntity = find(entities, item => item.code === entityCode);
    if (!mainEntity) {
      return;
    }

    const dataSourceCode = props.dataSourceCode || "list";
    if (!context.scope.stores[dataSourceCode]) {
      const { columns, pageSize } = props;
      const properties: string[] = uniq(props.queryProperties || [
        'id',
        ...map(filter(columns, column => !!column.code), column => column.code),
        ...props.extraProperties || [],
      ]);
      const listDataStoreConfig: EntityStoreConfig = {
        type: "entityStore",
        name: dataSourceCode,
        entityModel: mainEntity,
        fixedFilters: props.fixedFilters,
        properties,
        orderBy: props.orderBy || [
          {
            field: 'id',
          }
        ],
        pagination: pageSize > 0 ? {
          limit: pageSize,
          offset: ((props.pageNum || 1) - 1) * pageSize,
        } : undefined,
        $exps: pageSize > 0 ? {
          "pagination.limit": `${pageSize}`,
          "pagination.offset": `(($scope.vars['stores-${dataSourceCode}-pageNum'] || 1) - 1) * ${pageSize}`,
        } : undefined,
      };
      context.scope.addStore(listDataStoreConfig);
    }
  },

  onReceiveMessage(message, state, props) {
    if (message.name === "refreshView") {
      state.scope.stores[props.dataSourceCode]?.loadData();
    }
  },

  Renderer(context, props, state) {
    const entities = rapidAppDefinition.getEntities();
    const entityCode = props.entityCode;
    let mainEntity: RapidEntity | undefined;

    if (entityCode) {
      mainEntity = find(entities, item => item.code === entityCode);
      if (!mainEntity) {
        const errorRockConfig = generateRockConfigOfError(new Error(`Entitiy with code '${entityCode}' not found.`))
        return renderRock({context, rockConfig: errorRockConfig});
      }
    }

    const dataSourceCode = props.dataSourceCode || "list";
    const tableColumnRocks: RockConfig[] = [];

    props.columns.forEach((column) => {
      let cell: RockConfig | RockConfig[] | null = null;

      let rpdField: RapidField | undefined;
      if (mainEntity) {
        rpdField = find(mainEntity.fields, { code: column.code });
        if (!rpdField) {
          console.warn(`Unknown field code '${column.code}'`);
        }
      }

      if (!column.title && rpdField) {
        column.title = rpdField.name;
      }

      if (column.cell) {
        cell = column.cell;
      } else if (column.type === "link") {
        const url: string | undefined = column.rendererProps?.url;
        const text: string | undefined = column.rendererProps?.text;
        if (url) {
          cell = {
            $type: "anchor",
            href: url,
            children: {
              $type: "text",
              $exps: {
                text: text ? `$rui.execVarText('${text}', $slot.record)` : "$slot.value",
              },
            },
            $exps: {
              href: `$rui.execVarText('${url}', $slot.record)`,
            }
          };
        }
      } else if (column.type === "auto") {
        let fieldType = column.fieldType || rpdField?.type || "text";
        let rendererType = column.rendererType || fieldTypeToDisplayRockTypeMap[fieldType] || "rapidTextRenderer";
        let defaultCellDisplayPropsOfFieldType: any = defaultCellDisplayPropsOfFieldTypes[fieldType] || {};
        let defaultCellDisplayPropsOfRendererType: any = defaultCellDisplayPropsOfRendererTypes[fieldType] || {};
        let fieldTypeRelatedRendererProps: any = {};
        if (rpdField) {
          if (fieldType === "option") {
            fieldTypeRelatedRendererProps = {
              dictionaryCode: rpdField.dataDictionary,
            };
          } else if ((fieldType === "relation" || fieldType === "relation[]") && !column.rendererType) {
            if (rpdField.relation === "many") {
              rendererType = "rapidArrayRenderer";
            } else {
              rendererType = "rapidObjectRenderer";
            }
          }
        }

        cell = {
          $type: rendererType,
          ...defaultCellDisplayPropsOfFieldType,
          ...defaultCellDisplayPropsOfRendererType,
          ...fieldTypeRelatedRendererProps,
          ...column.rendererProps,
          $exps: {
            value: "$slot.value",
            ...(column.rendererProps?.$exps || {}),
          }
        };
      }

      const tableColumnRock: RockConfig = {
        ...column,
        $type: "rapidTableColumn",
        cell,
      };
      tableColumnRocks.push(tableColumnRock);
    })

    if (!props.hideActionsColumn) {
      forEach(props.actions, (recordActionConfig) => {
        set(recordActionConfig, "$exps.recordId", "$slot.record.id");
      });

      if (props.actions && props.actions.length) {
        const tableActionsColumnRock: RockConfig = {
          $type: "rapidTableColumn",
          title: '操作',
          code: 'id',
          key: '_actions',
          width: props.actionsColumnWidth || '150px',
          fixed: 'right',
          cell: props.actions,
        };
        tableColumnRocks.push(tableActionsColumnRock);
      }
    }

    let rowSelection = null;
    if (props.selectionMode && props.selectionMode !== "none") {
      rowSelection = {
        type: props.selectionMode === "multiple" ? "checkbox" : "radio",
        onChange: [
          {
            $action: "setVars",
            $exps: {
              [`vars.${props.$id}-selectedIds`]: "$event.args[0]",
            }
          },
          {
            $action: "handleEvent",
            eventName: "onSelectedIdsChange",
            handlers: props.onSelectedIdsChange,
            $exps: {
              args: "{selectedIds: $event.args[0], selectedRecords: $event.args[1]}",
            }
          }
        ]
      };
    }

    const tableRockConfig: RockConfig = {
      $id: `${props.$id}-table`,
      $type: "rapidTable",
      $exps: {
        dataSource: `$scope.stores.${dataSourceCode}.data?.list`,
        pagination: props.pageSize > 0 ? `{pageSize: ${props.pageSize}, current: $scope.vars["${`stores-${dataSourceCode}-pageNum`}"], total: $scope.stores.${dataSourceCode}.data?.total}` : "false",
        // "rowSelection.selectedRowKeys": `$scope.vars['${props.$id}-selectedIds']`,
      },
      size: "small",
      rowKey: "id",
      rowSelection,
      columns: tableColumnRocks,
      showHeader: props.showHeader,
      ...props.tableProps,
      convertListToTree: props.convertListToTree,
      listIdField: props.listIdField,
      listParentField: props.listParentField,
      treeChildrenField: props.treeChildrenField,
      onChange: [
        {
          $action: "script",
          script: async (event: RockEvent) => {
            const [ pagination ] = event.args;
            const store: EntityStore = event.scope.stores[dataSourceCode];
            // store.setPagination({
            //   limit: props.pageSize,
            //   offset: ((pagination.current || 1) - 1) * props.pageSize
            // });
            event.scope.setVars({
              [`stores-${dataSourceCode}-pageNum`]: pagination.current,
            })
            await store.loadData();
          }
        },
      ],
    };

    const toolbarRockConfig: RapidToolbarRockConfig = {
      $id: `${props.$id}-toolbar`,
      $type: "rapidToolbar",
      items: props.listActions,
      extras: props.extraActions,
      dataSourceCode: props.dataSourceCode,
    }

    const rockChildrenConfig: RockChildrenConfig = [
      toolbarRockConfig,
      tableRockConfig,
    ];

    return renderRockChildren({context, rockChildrenConfig});
  },

  setCellDisplayDefaultProps(rendererType: string, defaultRendererProps: Record<string, any>) {
    const originProps = defaultCellDisplayPropsOfRendererTypes[rendererType];
    const mergedProps = merge({}, originProps, defaultRendererProps);
    defaultCellDisplayPropsOfRendererTypes[rendererType] = mergedProps;
  },

  ...RapidEntityListMeta
} as Rock<RapidEntityListRockConfig, RapidEntityListState>;