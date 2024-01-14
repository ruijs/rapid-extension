import { Rock } from "@ruiapp/move-style";
import RapidCurrencyRendererMeta from "./RapidCurrencyRendererMeta";
import { RapidCurrencyRendererRockConfig } from "./rapid-currency-renderer-types";
import { isNull, isString, isUndefined } from "lodash";

export default {
  $type: "rapidCurrencyRenderer",

  Renderer(context, props: RapidCurrencyRendererRockConfig) {
    const { defaultText, usingThousandSeparator, decimalPlaces, roundingMode, currencyCode } = props;
    let { value } = props;
    if (isUndefined(value) || isNull(value)) {
      return defaultText || "";
    }

    if (isString(value)) {
      value = parseFloat(value);
    }

    const useGrouping = !!usingThousandSeparator;

    if (roundingMode !== "halfExpand" && decimalPlaces) {
      const powNum = Math.pow(10, decimalPlaces);
      if (roundingMode === "ceil") {
        value = Math.ceil(value * powNum) / powNum;
      } else if (roundingMode === "floor") {
        value = Math.floor(value * powNum) / powNum;
      }
    }

    return Intl.NumberFormat('Zh-cn', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimalPlaces,
      useGrouping: useGrouping,
    }).format(value);
  },

  ...RapidCurrencyRendererMeta,
} as Rock;