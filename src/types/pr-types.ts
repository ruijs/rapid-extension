import type { RockChildrenConfig, RockPageEventSubscriptionConfig, StoreConfig } from "@ruiapp/move-style";

/**
 * 实体
 */
export type PrEntity<TEntityCodes=string, TDictionaryCodes=string> = {
  /**
   * 实体编码
   */
  code: string;

  /**
   * 实体名称
   */
  name: string;

  /**
   * 实体描述
   */
  description?: string;

  /**
   * 实体字段
   */
  fields: PrField<TEntityCodes, TDictionaryCodes>[];
}

/**
 * 实体字段
 */
export type PrField<TEntityCodes=string, TDictionaryCodes=string> = {
  /**
   * 字段编码
   */
  code: string;

  /**
   * 字段名称
   */
  name: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 默认值
   */
  defaultValue?: string;

  /**
   * 字段类型
   * @enum PrFieldType
   */
  fieldType: PrFieldType;

  /**
   * 必需填写
   */
  required?: boolean;

  /**
   * 是否扩展字段
   */
  isExtended?: boolean;

  /**
   * 数据字典编码。当类型为`option`时设置
   */
  dictionaryCode?: TDictionaryCodes;

  /**
   * 引用实体编码
   */
  referenceEntityCode?: TEntityCodes;
}

/**
 * 实体字段类型
 * @name PrFieldType
 */
export type PrFieldType =
  | "string"
  | "string[]"
  | "bool"
  | "bool[]"
  | "integer"
  | "integer[]"
  | "long"
  | "long[]"
  | "float"
  | "float[]"
  | "double"
  | "double[]"
  | "date"
  | "date[]"
  | "time"
  | "time[]"
  | "datetime"
  | "datetime[]"
  | "datetimetz"
  | "datetimetz[]"
  | "object"
  | "object[]"
  | "option"
  | "option[]"
  | "relation"
  | "relation[]";

/**
 * 数据字典
 */
export type PrDictionary = {
  /**
   * 字典编码
   */
  code: string;

  /**
   * 字典名称
   */
  name: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 字典项值类型
   */
  valueType: "string" | "integer";

  /**
   * 字典级别
   */
  level: "sys" | "app" | "user";

  /**
   * 字典项
   */
  items: PrDictionaryItem[];
}

/**
 * 数据字典项
 */
export type PrDictionaryItem = {
  /**
   * 名称
   */
  name: string;

  /**
   * 值
   */
  value: string | number;

  /**
   * 颜色
   */
  color: string;

  /**
   * 图标
   */
  icon: string;

  /**
   * 描述
   */
  description?: string;
}



export type PrDataSource = 
  | PrDictionaryDetailDataSource
  | PrEntityDetailDataSource
  | PrEntityListDataSource
  ;


export type PrDictionaryDetailDataSource = {
  dataSourceType: "dictionaryDetail";
  code: string;
  dictionaryCode: string;
}

export type PrEntityDetailDataSource = {
  dataSourceType: "entityDetail";
  code: string;
  entityCode: string;
}

export type PrEntityListDataSource = {
  dataSourceType: "entityList";
  code: string;
  entityCode: string;
}

export type PrPage =
  | PrRapidPage
  ;

/**
 * Rapid页面
 */
export type PrRapidPage = {
  /**
   * 页面编码
   */
  code: string;

  /**
   * 页面名称
   */
  name: string;

  /**
   * 页面标题
   */
  title?: string;

  /**
   * 页面模板名称
   */
  templateType: "rapidPage";

  /**
   * 页面区块
   */
  blocks?: any[];

  stores?: StoreConfig[];

  /**
   * 视图配置
   */
  view?: RockChildrenConfig;

  eventSubscriptions?: RockPageEventSubscriptionConfig[];
};
